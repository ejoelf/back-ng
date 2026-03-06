import { Business } from "../../database/models/index.js";
import { AppError } from "../../utils/app-error.js";

function safeTrim(value) {
  return String(value ?? "").trim();
}

function normalizeSchedule(input) {
  const fallback = {
    openDays: [2, 3, 4, 5, 6],
    intervals: [
      { start: "09:00", end: "12:30" },
      { start: "16:00", end: "20:30" },
    ],
    stepMinutes: 30,
    bufferMin: 0,
  };

  if (!input || typeof input !== "object") {
    return fallback;
  }

  const openDays = Array.isArray(input.openDays)
    ? input.openDays
        .map((x) => Number(x))
        .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
    : fallback.openDays;

  const intervals = Array.isArray(input.intervals)
    ? input.intervals
        .map((x) => ({
          start: safeTrim(x?.start),
          end: safeTrim(x?.end),
        }))
        .filter((x) => x.start && x.end)
    : fallback.intervals;

  return {
    openDays: openDays.length ? openDays : fallback.openDays,
    intervals: intervals.length ? intervals : fallback.intervals,
    stepMinutes: Number(input.stepMinutes) || fallback.stepMinutes,
    bufferMin: Number(input.bufferMin) || 0,
  };
}

function serializeBusiness(row) {
  return {
    id: row.id,
    name: row.name || "",
    address: row.address || "",
    whatsapp: row.whatsapp || "",
    logoUrl: row.logoUrl || "",
    heroImageUrl: row.heroImageUrl || "",
    schedule: row.scheduleJson || {
      openDays: [2, 3, 4, 5, 6],
      intervals: [
        { start: "09:00", end: "12:30" },
        { start: "16:00", end: "20:30" },
      ],
      stepMinutes: 30,
      bufferMin: 0,
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function getMainBusinessRow() {
  const row = await Business.findOne({
    order: [["createdAt", "ASC"]],
  });

  if (!row) {
    throw new AppError("No existe un negocio configurado todavía.", 404);
  }

  return row;
}

export async function getBusiness() {
  const row = await getMainBusinessRow();
  return serializeBusiness(row);
}

export async function updateBusiness(payload) {
  const row = await getMainBusinessRow();

  if (payload?.name != null) row.name = safeTrim(payload.name) || row.name;
  if (payload?.address != null) row.address = safeTrim(payload.address);
  if (payload?.whatsapp != null) row.whatsapp = safeTrim(payload.whatsapp);
  if (payload?.logoUrl != null) row.logoUrl = safeTrim(payload.logoUrl);
  if (payload?.heroImageUrl != null) row.heroImageUrl = safeTrim(payload.heroImageUrl);

  if (payload?.schedule != null) {
    row.scheduleJson = normalizeSchedule(payload.schedule);
  }

  await row.save();

  return serializeBusiness(row);
}