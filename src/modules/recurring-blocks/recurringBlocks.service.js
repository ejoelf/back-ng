import { Op } from "sequelize";
import { RecurringBlock, Block, Business } from "../../database/models/index.js";
import { AppError } from "../../utils/app-error.js";

function safeTrim(v) {
  return String(v ?? "").trim();
}

function isValidISODate(v) {
  return /^\d{4}-\d{2}-\d{2}$/.test(safeTrim(v));
}

function isValidHHMM(v) {
  return /^\d{2}:\d{2}$/.test(safeTrim(v));
}

function parseDateLocal(dateStr) {
  const s = safeTrim(dateStr);
  if (!isValidISODate(s)) {
    throw new AppError("La fecha es inválida. Usá YYYY-MM-DD.", 400);
  }
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function formatDateLocal(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function addDays(dateStr, days) {
  const d = parseDateLocal(dateStr);
  d.setDate(d.getDate() + days);
  return formatDateLocal(d);
}

function weekStartMonday(dateStr) {
  const d = parseDateLocal(dateStr);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return formatDateLocal(d);
}

function serializeRecurringBlock(row) {
  return {
    id: row.id,
    businessId: row.businessId,
    dayOfWeek: row.dayOfWeek,
    staffId: row.staffId,
    start: row.start,
    end: row.end,
    reason: row.reason || "",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function getMainBusiness() {
  const business = await Business.findOne({ order: [["createdAt", "ASC"]] });
  if (!business) throw new AppError("No existe un negocio configurado todavía.", 500);
  return business;
}

export async function listRecurringBlocks() {
  const rows = await RecurringBlock.findAll({
    order: [
      ["dayOfWeek", "ASC"],
      ["start", "ASC"],
    ],
  });

  return rows.map(serializeRecurringBlock);
}

export async function createRecurringBlock(payload) {
  const business = await getMainBusiness();

  const dayOfWeek = Number(payload?.dayOfWeek);
  const staffId = safeTrim(payload?.staffId) || null;
  const start = safeTrim(payload?.start);
  const end = safeTrim(payload?.end);
  const reason = safeTrim(payload?.reason);

  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    throw new AppError("El día de la semana es inválido.", 400);
  }

  if (!isValidHHMM(start) || !isValidHHMM(end)) {
    throw new AppError("El horario es inválido. Usá HH:MM.", 400);
  }

  if (end <= start) {
    throw new AppError("La hora fin debe ser mayor a la hora inicio.", 400);
  }

  const exists = await RecurringBlock.findOne({
    where: {
      businessId: business.id,
      dayOfWeek,
      staffId,
      start,
      end,
    },
  });

  if (exists) {
    throw new AppError("Ya existe una regla igual.", 400);
  }

  const row = await RecurringBlock.create({
    businessId: business.id,
    dayOfWeek,
    staffId,
    start,
    end,
    reason: reason || null,
  });

  return serializeRecurringBlock(row);
}

export async function deleteRecurringBlock(id) {
  const row = await RecurringBlock.findByPk(id);
  if (!row) throw new AppError("Bloqueo recurrente no encontrado.", 404);

  await row.destroy();
  return { ok: true };
}

export async function createRecurringBlocksFromWeek(payload) {
  const business = await getMainBusiness();

  const weekDateStr = safeTrim(payload?.weekDateStr);
  const staffId = safeTrim(payload?.staffId) || null;
  const includeFullDay = Boolean(payload?.includeFullDay);

  if (!isValidISODate(weekDateStr)) {
    throw new AppError("La fecha de la semana es inválida.", 400);
  }

  const startWeek = weekStartMonday(weekDateStr);
  const endWeek = addDays(startWeek, 6);

  const weekBlocks = await Block.findAll({
    where: {
      businessId: business.id,
      dateStr: {
        [Op.gte]: startWeek,
        [Op.lte]: endWeek,
      },
      ...(staffId ? { staffId } : {}),
    },
    order: [
      ["dateStr", "ASC"],
      ["start", "ASC"],
    ],
  });

  let created = 0;
  let skipped = 0;

  for (const block of weekBlocks) {
    const isFullDay = block.start === "00:00" && block.end === "23:59";
    if (!includeFullDay && isFullDay) {
      skipped++;
      continue;
    }

    const dow = parseDateLocal(block.dateStr).getDay();

    const exists = await RecurringBlock.findOne({
      where: {
        businessId: business.id,
        dayOfWeek: dow,
        staffId: block.staffId,
        start: block.start,
        end: block.end,
      },
    });

    if (exists) {
      skipped++;
      continue;
    }

    await RecurringBlock.create({
      businessId: business.id,
      dayOfWeek: dow,
      staffId: block.staffId,
      start: block.start,
      end: block.end,
      reason: block.reason || "Bloqueo recurrente",
    });

    created++;
  }

  return {
    created,
    skipped,
    weekStart: startWeek,
  };
}