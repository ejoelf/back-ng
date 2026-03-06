import { Op } from "sequelize";
import { Block, Business } from "../../database/models/index.js";
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

function inRange(dateStr, from, to) {
  return dateStr >= from && dateStr <= to;
}

function serializeBlock(row) {
  return {
    id: row.id,
    businessId: row.businessId,
    dateStr: row.dateStr,
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

export async function listBlocks() {
  const rows = await Block.findAll({
    order: [
      ["dateStr", "DESC"],
      ["start", "ASC"],
      ["createdAt", "DESC"],
    ],
  });

  return rows.map(serializeBlock);
}

export async function createBlock(payload) {
  const business = await getMainBusiness();

  const dateStr = safeTrim(payload?.dateStr);
  const start = safeTrim(payload?.start);
  const end = safeTrim(payload?.end);
  const reason = safeTrim(payload?.reason);
  const staffId = safeTrim(payload?.staffId) || null;

  if (!isValidISODate(dateStr)) {
    throw new AppError("La fecha es inválida.", 400);
  }

  if (!isValidHHMM(start) || !isValidHHMM(end)) {
    throw new AppError("El horario es inválido. Usá HH:MM.", 400);
  }

  if (end <= start) {
    throw new AppError("La hora fin debe ser mayor a la hora inicio.", 400);
  }

  const exists = await Block.findOne({
    where: {
      businessId: business.id,
      dateStr,
      staffId,
      start,
      end,
    },
  });

  if (exists) {
    throw new AppError("Ya existe un bloqueo igual.", 400);
  }

  const row = await Block.create({
    businessId: business.id,
    dateStr,
    staffId,
    start,
    end,
    reason: reason || null,
  });

  return serializeBlock(row);
}

export async function deleteBlock(id) {
  const row = await Block.findByPk(id);
  if (!row) throw new AppError("Bloqueo no encontrado.", 404);

  await row.destroy();
  return { ok: true };
}

export async function copyBlocksFromWeek(payload) {
  const business = await getMainBusiness();

  const targetWeekDateStr = safeTrim(payload?.targetWeekDateStr);
  const staffId = safeTrim(payload?.staffId) || null;
  const includeFullDay = Boolean(payload?.includeFullDay);

  if (!isValidISODate(targetWeekDateStr)) {
    throw new AppError("La fecha de la semana destino es inválida.", 400);
  }

  const targetStart = weekStartMonday(targetWeekDateStr);
  const sourceStart = addDays(targetStart, -7);
  const sourceEnd = addDays(sourceStart, 6);

  const sourceBlocks = await Block.findAll({
    where: {
      businessId: business.id,
      dateStr: {
        [Op.gte]: sourceStart,
        [Op.lte]: sourceEnd,
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

  for (const block of sourceBlocks) {
    const isFullDay = block.start === "00:00" && block.end === "23:59";
    if (!includeFullDay && isFullDay) {
      skipped++;
      continue;
    }

    const newDateStr = addDays(block.dateStr, 7);

    const exists = await Block.findOne({
      where: {
        businessId: business.id,
        dateStr: newDateStr,
        staffId: block.staffId,
        start: block.start,
        end: block.end,
        reason: block.reason,
      },
    });

    if (exists) {
      skipped++;
      continue;
    }

    await Block.create({
      businessId: business.id,
      dateStr: newDateStr,
      staffId: block.staffId,
      start: block.start,
      end: block.end,
      reason: block.reason,
    });

    created++;
  }

  return {
    created,
    skipped,
    sourceStart,
    targetStart,
  };
}