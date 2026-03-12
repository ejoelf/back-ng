import { DateTime } from "luxon";

export const BUSINESS_TZ = "America/Argentina/Cordoba";

function safeZone(zone) {
  return zone || BUSINESS_TZ;
}

export function nowInBusinessTz(zone = BUSINESS_TZ) {
  return DateTime.now().setZone(safeZone(zone));
}

export function parseDateStrInBusinessTz(dateStr, zone = BUSINESS_TZ) {
  const dt = DateTime.fromISO(String(dateStr || "").trim(), {
    zone: safeZone(zone),
  }).startOf("day");

  if (!dt.isValid) {
    throw new Error("Fecha inválida");
  }

  return dt;
}

export function parseHHMM(hhmm) {
  const value = String(hhmm || "").trim();

  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new Error("Horario inválido");
  }

  const [hour, minute] = value.split(":").map(Number);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    throw new Error("Horario inválido");
  }

  return { hour, minute };
}

export function combineBusinessDateAndTime(dateStr, hhmm, zone = BUSINESS_TZ) {
  const base = parseDateStrInBusinessTz(dateStr, zone);
  const { hour, minute } = parseHHMM(hhmm);

  return base.set({
    hour,
    minute,
    second: 0,
    millisecond: 0,
  });
}

export function toBusinessDateStr(dateLike, zone = BUSINESS_TZ) {
  return DateTime.fromJSDate(
    dateLike instanceof Date ? dateLike : new Date(dateLike),
    { zone: "utc" }
  )
    .setZone(safeZone(zone))
    .toFormat("yyyy-MM-dd");
}

export function toBusinessHHMM(dateLike, zone = BUSINESS_TZ) {
  return DateTime.fromJSDate(
    dateLike instanceof Date ? dateLike : new Date(dateLike),
    { zone: "utc" }
  )
    .setZone(safeZone(zone))
    .toFormat("HH:mm");
}

export function businessDateTimeToUTCDate(dateTime) {
  return dateTime.toUTC().toJSDate();
}

export function utcDateToBusinessDateTime(dateLike, zone = BUSINESS_TZ) {
  return DateTime.fromJSDate(
    dateLike instanceof Date ? dateLike : new Date(dateLike),
    { zone: "utc" }
  ).setZone(safeZone(zone));
}

export function addMinutesToDateTime(dateTime, minutes) {
  return dateTime.plus({ minutes: Number(minutes || 0) });
}

export function startOfBusinessDayUTC(dateStr, zone = BUSINESS_TZ) {
  return parseDateStrInBusinessTz(dateStr, zone).startOf("day").toUTC().toJSDate();
}

export function endOfBusinessDayUTC(dateStr, zone = BUSINESS_TZ) {
  return parseDateStrInBusinessTz(dateStr, zone)
    .plus({ days: 1 })
    .startOf("day")
    .toUTC()
    .toJSDate();
}