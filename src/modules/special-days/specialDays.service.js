import { Op } from "sequelize";
import { SpecialDay, Business } from "../../database/models/index.js";
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

function serializeSpecialDay(row) {
  return {
    id: row.id,
    businessId: row.businessId,
    dateStr: row.dateStr,
    open: Boolean(row.open),
    intervals: Array.isArray(row.intervalsJson) ? row.intervalsJson : [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function getMainBusiness() {
  const business = await Business.findOne({ order: [["createdAt", "ASC"]] });
  if (!business) throw new AppError("No existe un negocio configurado todavía.", 500);
  return business;
}

function normalizeIntervals(intervals) {
  if (!Array.isArray(intervals)) return [];

  const clean = [];

  for (const item of intervals) {
    const start = safeTrim(item?.start);
    const end = safeTrim(item?.end);

    if (!isValidHHMM(start) || !isValidHHMM(end)) {
      throw new AppError("Hay una franja horaria inválida.", 400);
    }

    if (end <= start) {
      throw new AppError("Cada franja debe tener fin mayor al inicio.", 400);
    }

    clean.push({ start, end });
  }

  return clean;
}

export async function listSpecialDays() {
  const rows = await SpecialDay.findAll({
    order: [["dateStr", "ASC"]],
  });

  return rows.map(serializeSpecialDay);
}

export async function upsertSpecialDay(payload) {
  const business = await getMainBusiness();

  const dateStr = safeTrim(payload?.dateStr);
  const open = Boolean(payload?.open);
  const intervals = normalizeIntervals(payload?.intervals);

  if (!isValidISODate(dateStr)) {
    throw new AppError("La fecha es inválida.", 400);
  }

  if (open && intervals.length === 0) {
    throw new AppError("Si el día está abierto, debés cargar al menos una franja.", 400);
  }

  let row = await SpecialDay.findOne({
    where: {
      businessId: business.id,
      dateStr,
    },
  });

  if (!row) {
    row = await SpecialDay.create({
      businessId: business.id,
      dateStr,
      open,
      intervalsJson: open ? intervals : [],
    });
  } else {
    row.open = open;
    row.intervalsJson = open ? intervals : [];
    await row.save();
  }

  return serializeSpecialDay(row);
}

export async function deleteSpecialDay(dateStr) {
  const row = await SpecialDay.findOne({
    where: { dateStr: safeTrim(dateStr) },
  });

  if (!row) {
    throw new AppError("Excepción no encontrada.", 404);
  }

  await row.destroy();
  return { ok: true };
}

export async function copySpecialDaysFromWeek(payload) {
  const business = await getMainBusiness();

  const targetWeekDateStr = safeTrim(payload?.targetWeekDateStr);

  if (!isValidISODate(targetWeekDateStr)) {
    throw new AppError("La fecha de la semana destino es inválida.", 400);
  }

  const targetStart = weekStartMonday(targetWeekDateStr);
  const sourceStart = addDays(targetStart, -7);
  const sourceEnd = addDays(sourceStart, 6);

  const sourceDays = await SpecialDay.findAll({
    where: {
      businessId: business.id,
      dateStr: {
        [Op.gte]: sourceStart,
        [Op.lte]: sourceEnd,
      },
    },
    order: [["dateStr", "ASC"]],
  });

  let created = 0;
  let skipped = 0;

  for (const day of sourceDays) {
    const newDateStr = addDays(day.dateStr, 7);

    const exists = await SpecialDay.findOne({
      where: {
        businessId: business.id,
        dateStr: newDateStr,
      },
    });

    if (exists) {
      skipped++;
      continue;
    }

    await SpecialDay.create({
      businessId: business.id,
      dateStr: newDateStr,
      open: Boolean(day.open),
      intervalsJson: Array.isArray(day.intervalsJson) ? day.intervalsJson : [],
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