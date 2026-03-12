import { Op } from "sequelize";
import {
  sequelize,
  Business,
  Staff,
  Service,
  Client,
  Appointment,
  Income,
  Block,
  RecurringBlock,
  SpecialDay,
} from "../../database/models/index.js";
import { AppError } from "../../utils/app-error.js";
import { env } from "../../config/env.js";
import {
  BUSINESS_TZ,
  nowInBusinessTz,
  parseDateStrInBusinessTz,
  combineBusinessDateAndTime,
  toBusinessDateStr,
  toBusinessHHMM,
  businessDateTimeToUTCDate,
  utcDateToBusinessDateTime,
  addMinutesToDateTime,
  startOfBusinessDayUTC,
  endOfBusinessDayUTC,
} from "../../utils/datetime.js";
import {
  sendAppointmentCancellationEmail,
  sendAppointmentRescheduledEmail,
} from "../../utils/mailer.js";

function safeString(value) {
  return value == null ? "" : String(value).trim();
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function only00or30FromDateTime(dt) {
  const m = dt.minute;
  return m === 0 || m === 30;
}

function normalizeApptStatusIn(value) {
  const v = safeString(value).toLowerCase();

  if (!v) return "confirmed";
  if (v === "done") return "completed";
  if (v === "no_show") return "no-show";

  const allowed = ["confirmed", "completed", "cancelled", "rescheduled", "no-show"];
  if (!allowed.includes(v)) {
    throw new AppError("El estado del turno es inválido.", 400);
  }

  return v;
}

function capitalizeName(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function parseDateStr(dateStr) {
  try {
    return parseDateStrInBusinessTz(dateStr, BUSINESS_TZ);
  } catch {
    throw new AppError("La fecha es inválida. Usá formato YYYY-MM-DD.", 400);
  }
}

function combineDateAndTime(dateStr, hhmm) {
  try {
    return combineBusinessDateAndTime(dateStr, hhmm, BUSINESS_TZ);
  } catch {
    throw new AppError("El horario es inválido.", 400);
  }
}

function addMinutes(dateTime, minutes) {
  return addMinutesToDateTime(dateTime, minutes);
}

function timeHHMM(dateLike) {
  if (dateLike?.toFormat) {
    return dateLike.toFormat("HH:mm");
  }
  return toBusinessHHMM(dateLike, BUSINESS_TZ);
}

function fireAndForget(promiseFactory) {
  Promise.resolve()
    .then(() => promiseFactory())
    .catch((error) => {
      console.error("[mailer] error enviando email:", error?.message || error);
    });
}

async function getMainBusiness() {
  const business = await Business.findOne({
    order: [["createdAt", "ASC"]],
  });

  if (!business) {
    throw new AppError("No existe un negocio configurado todavía.", 500);
  }

  return business;
}

function getScheduleFromBusiness(business) {
  const raw = business?.scheduleJson || {};
  const intervals = Array.isArray(raw?.intervals) ? raw.intervals : [];

  return {
    openDays: Array.isArray(raw?.openDays) ? raw.openDays : [2, 3, 4, 5, 6],
    intervals:
      intervals.length > 0
        ? intervals
        : [
            { start: "09:00", end: "12:30" },
            { start: "16:00", end: "20:30" },
          ],
  };
}

function getScheduleFromStaffOrBusiness(staff, business) {
  const override = staff?.scheduleOverrideJson;

  if (override && Array.isArray(override?.intervals) && override.intervals.length > 0) {
    return {
      openDays: Array.isArray(override?.openDays) ? override.openDays : [2, 3, 4, 5, 6],
      intervals: override.intervals,
    };
  }

  return getScheduleFromBusiness(business);
}

function getSpecialDayIntervals(specialDay) {
  return Array.isArray(specialDay?.intervalsJson) ? specialDay.intervalsJson : [];
}

function getActiveIntervals({ business, staff, specialDay, dateStr }) {
  if (specialDay) {
    if (specialDay.open === false) return [];
    if (specialDay.open === true) return getSpecialDayIntervals(specialDay);
  }

  const schedule = getScheduleFromStaffOrBusiness(staff, business);
  const day = parseDateStr(dateStr).weekday % 7;

  if (!schedule.openDays.includes(day)) return [];
  return schedule.intervals;
}

async function getValidatedServiceAndStaff({ serviceId, staffId }) {
  const serviceIdSafe = safeString(serviceId);
  const staffIdSafe = safeString(staffId);

  if (!serviceIdSafe) {
    throw new AppError("El servicio es obligatorio.", 400);
  }

  if (!staffIdSafe) {
    throw new AppError("El staff es obligatorio.", 400);
  }

  const [service, staff] = await Promise.all([
    Service.findByPk(serviceIdSafe),
    Staff.findByPk(staffIdSafe),
  ]);

  if (!service || !service.isActive) {
    throw new AppError("El servicio no existe o está inactivo.", 404);
  }

  if (!staff || !staff.isActive) {
    throw new AppError("El staff no existe o está inactivo.", 404);
  }

  if (service.businessId !== staff.businessId) {
    throw new AppError("El servicio y el staff no pertenecen al mismo negocio.", 400);
  }

  const allowed = await service.getAllowedStaff({
    where: { id: staff.id },
    joinTableAttributes: [],
  });

  const serviceHasRestrictions = await service.countAllowedStaff();

  if (serviceHasRestrictions > 0 && allowed.length === 0) {
    throw new AppError("Ese staff no puede realizar el servicio seleccionado.", 400);
  }

  return { service, staff };
}

async function getBusyItems({ businessId, staffId, dateStr }) {
  const dayStart = startOfBusinessDayUTC(dateStr, BUSINESS_TZ);
  const dayEnd = endOfBusinessDayUTC(dateStr, BUSINESS_TZ);

  const [appointments, blocks, recurringBlocks] = await Promise.all([
    Appointment.findAll({
      where: {
        businessId,
        staffId,
        startAt: {
          [Op.gte]: dayStart,
          [Op.lt]: dayEnd,
        },
        status: {
          [Op.ne]: "cancelled",
        },
      },
      order: [["startAt", "ASC"]],
    }),
    Block.findAll({
      where: {
        businessId,
        dateStr,
        [Op.or]: [{ staffId: null }, { staffId }],
      },
      order: [["start", "ASC"]],
    }),
    RecurringBlock.findAll({
      where: {
        businessId,
        dayOfWeek: parseDateStr(dateStr).weekday % 7,
        [Op.or]: [{ staffId: null }, { staffId }],
      },
      order: [["start", "ASC"]],
    }),
  ]);

  const busy = [];

  for (const a of appointments) {
    busy.push({
      startAt: new Date(a.startAt),
      endAt: new Date(a.endAt),
      type: "appointment",
      id: a.id,
    });
  }

  for (const b of blocks) {
    const startDt = combineDateAndTime(dateStr, b.start);
    const endDt = combineDateAndTime(dateStr, b.end);

    busy.push({
      startAt: businessDateTimeToUTCDate(startDt),
      endAt: businessDateTimeToUTCDate(endDt),
      type: "block",
      id: b.id,
    });
  }

  for (const rb of recurringBlocks) {
    const startDt = combineDateAndTime(dateStr, rb.start);
    const endDt = combineDateAndTime(dateStr, rb.end);

    busy.push({
      startAt: businessDateTimeToUTCDate(startDt),
      endAt: businessDateTimeToUTCDate(endDt),
      type: "recurring_block",
      id: rb.id,
    });
  }

  return busy;
}

function serializeAppointment(row) {
  const client = row.client;
  const service = row.service;
  const staff = row.staff;

  return {
    id: row.id,
    businessId: row.businessId,
    clientId: row.clientId,
    serviceId: row.serviceId,
    staffId: row.staffId,
    startAt: row.startAt,
    endAt: row.endAt,
    status: row.status,
    notes: row.notes || "",
    channel: row.channel || "web",
    allowOverlap: Boolean(row.allowOverlap),

    clientName: row.clientName || client?.name || "Cliente",
    clientPhone: row.clientPhone || client?.phone || "",
    clientEmail: row.clientEmail || client?.email || "",

    serviceName: row.serviceName || service?.name || "Servicio",
    staffName: row.staffName || staff?.name || "Staff",

    price: Number(row.price ?? service?.price ?? 0) || 0,

    dateStr: row.startAt ? toBusinessDateStr(row.startAt, BUSINESS_TZ) : "",
    start: row.startAt ? toBusinessHHMM(row.startAt, BUSINESS_TZ) : "",
    end: row.endAt ? toBusinessHHMM(row.endAt, BUSINESS_TZ) : "",
  };
}

export async function getAvailability({ dateStr, serviceId, staffId }) {
  const dateStrSafe = safeString(dateStr);
  if (!dateStrSafe) {
    throw new AppError("La fecha es obligatoria.", 400);
  }

  const business = await getMainBusiness();
  const { service, staff } = await getValidatedServiceAndStaff({ serviceId, staffId });

  const specialDay = await SpecialDay.findOne({
    where: {
      businessId: business.id,
      dateStr: dateStrSafe,
    },
  });

  const intervals = getActiveIntervals({
    business,
    staff,
    specialDay,
    dateStr: dateStrSafe,
  });

  if (!intervals.length) {
    return [];
  }

  const busyItems = await getBusyItems({
    businessId: business.id,
    staffId: staff.id,
    dateStr: dateStrSafe,
  });

  const durationMin = Number(service.durationMin || 30);
  const nowBusiness = nowInBusinessTz(BUSINESS_TZ);
  const todayStr = nowBusiness.toFormat("yyyy-MM-dd");

  const slots = [];

  for (const interval of intervals) {
    const intervalStart = combineDateAndTime(dateStrSafe, interval.start);
    const intervalEnd = combineDateAndTime(dateStrSafe, interval.end);

    let current = intervalStart;

    while (current < intervalEnd) {
      const slotStart = current;
      const slotEnd = addMinutes(slotStart, durationMin);

      const slotStartUTC = businessDateTimeToUTCDate(slotStart);
      const slotEndUTC = businessDateTimeToUTCDate(slotEnd);

      const startsInsideWindow = slotStart >= intervalStart && slotStart < intervalEnd;
      const endsInsideWindow = slotEnd <= intervalEnd;
      const respectsHalfHour = only00or30FromDateTime(slotStart);
      const notPast = dateStrSafe !== todayStr || slotStart >= nowBusiness;

      const collides = busyItems.some((item) =>
        overlaps(slotStartUTC, slotEndUTC, item.startAt, item.endAt)
      );

      if (startsInsideWindow && endsInsideWindow && respectsHalfHour && notPast && !collides) {
        slots.push({
          startAt: slotStartUTC.toISOString(),
          endAt: slotEndUTC.toISOString(),
          label: timeHHMM(slotStart),
        });
      }

      current = addMinutes(current, 30);
    }
  }

  return slots;
}

export async function listAppointmentsByDate({ dateStr, staffId }) {
  const dateStrSafe = safeString(dateStr);

  if (!dateStrSafe) {
    throw new AppError("La fecha es obligatoria.", 400);
  }

  const business = await getMainBusiness();

  const dayStart = startOfBusinessDayUTC(dateStrSafe, BUSINESS_TZ);
  const dayEnd = endOfBusinessDayUTC(dateStrSafe, BUSINESS_TZ);

  const where = {
    businessId: business.id,
    startAt: {
      [Op.gte]: dayStart,
      [Op.lt]: dayEnd,
    },
    status: {
      [Op.ne]: "cancelled",
    },
  };

  if (safeString(staffId)) {
    where.staffId = safeString(staffId);
  }

  const rows = await Appointment.findAll({
    where,
    include: [
      { model: Client, as: "client" },
      { model: Service, as: "service" },
      { model: Staff, as: "staff" },
      { model: Income, as: "income" },
    ],
    order: [["startAt", "ASC"]],
  });

  return rows.map(serializeAppointment);
}

export async function listAppointments({ clientId }) {
  const business = await getMainBusiness();

  const where = {
    businessId: business.id,
  };

  if (safeString(clientId)) {
    where.clientId = safeString(clientId);
  }

  const rows = await Appointment.findAll({
    where,
    include: [
      { model: Client, as: "client" },
      { model: Service, as: "service" },
      { model: Staff, as: "staff" },
      { model: Income, as: "income" },
    ],
    order: [["startAt", "DESC"]],
  });

  return rows.map(serializeAppointment);
}

async function findOrCreateClient({ transaction, businessId, client }) {
  const phone = safeString(client?.phone);
  const name = safeString(client?.name);
  const email = safeString(client?.email);

  if (!phone) {
    throw new AppError("El teléfono/WhatsApp del cliente es obligatorio.", 400);
  }

  if (!name) {
    throw new AppError("El nombre del cliente es obligatorio.", 400);
  }

  let row = await Client.findOne({
    where: {
      businessId,
      phone,
    },
    transaction,
  });

  if (!row) {
    row = await Client.create(
      {
        businessId,
        name: capitalizeName(name),
        phone,
        email: email || null,
        notes: null,
        isActive: true,
      },
      { transaction }
    );

    return row;
  }

  const patch = {};

  if (!safeString(row.name)) patch.name = capitalizeName(name);
  if (email && !safeString(row.email)) patch.email = email;
  if (row.isActive === false) patch.isActive = true;

  if (Object.keys(patch).length > 0) {
    await row.update(patch, { transaction });
  }

  return row;
}

async function ensureSlotAvailable({
  businessId,
  staffId,
  dateStr,
  startAt,
  endAt,
  allowOverlap,
  excludeAppointmentId = null,
}) {
  if (allowOverlap) return;

  const busy = await getBusyItems({ businessId, staffId, dateStr });

  const collides = busy.some((item) => {
    if (excludeAppointmentId && item.type === "appointment" && item.id === excludeAppointmentId) {
      return false;
    }

    return overlaps(startAt, endAt, item.startAt, item.endAt);
  });

  if (collides) {
    throw new AppError("Ese horario ya está ocupado o bloqueado. Elegí otro.", 409);
  }
}

export async function createAppointment({
  serviceId,
  staffId,
  startAt,
  notes,
  channel,
  allowOverlap,
  client,
}) {
  const { service, staff } = await getValidatedServiceAndStaff({ serviceId, staffId });

  const start = new Date(startAt);

  if (Number.isNaN(start.getTime())) {
    throw new AppError("La fecha/hora del turno es inválida.", 400);
  }

  const startBusiness = utcDateToBusinessDateTime(start, BUSINESS_TZ);

  if (!only00or30FromDateTime(startBusiness)) {
    throw new AppError("Los turnos solo pueden arrancar en :00 o :30.", 400);
  }

  const businessId = service.businessId;
  const dateStr = toBusinessDateStr(start, BUSINESS_TZ);
  const end = addMinutesToDateTime(startBusiness, Number(service.durationMin || 30));
  const endUTC = businessDateTimeToUTCDate(end);

  return sequelize.transaction(async (transaction) => {
    const clientRow = await findOrCreateClient({
      transaction,
      businessId,
      client,
    });

    await ensureSlotAvailable({
      businessId,
      staffId,
      dateStr,
      startAt: start,
      endAt: endUTC,
      allowOverlap: Boolean(allowOverlap),
    });

    const appointment = await Appointment.create(
      {
        businessId,
        clientId: clientRow.id,
        serviceId: service.id,
        staffId: staff.id,
        startAt: start,
        endAt: endUTC,
        status: "confirmed",
        notes: safeString(notes) || null,
        channel: safeString(channel) || "web",
        allowOverlap: Boolean(allowOverlap),

        clientName: clientRow.name,
        clientPhone: clientRow.phone,
        clientEmail: clientRow.email || null,

        serviceName: service.name,
        staffName: staff.name,
        price: Number(service.price || 0),
      },
      { transaction }
    );

    await Income.create(
      {
        businessId,
        appointmentId: appointment.id,
        serviceId: service.id,
        date: dateStr,
        clientName: clientRow.name,
        serviceName: service.name,
        amountEstimated: Number(service.price || 0),
        amountFinal: null,
        paymentMethod: null,
        paidStatus: "pending",
      },
      { transaction }
    );

    const created = await Appointment.findByPk(appointment.id, {
      include: [
        { model: Client, as: "client" },
        { model: Service, as: "service" },
        { model: Staff, as: "staff" },
      ],
      transaction,
    });

    return serializeAppointment(created);
  });
}

export async function updateAppointmentStatus({ appointmentId, status }) {
  const normalized = normalizeApptStatusIn(status);

  const row = await Appointment.findByPk(appointmentId);

  if (!row) {
    throw new AppError("Turno no encontrado.", 404);
  }

  row.status = normalized;
  await row.save();

  const income = await Income.findOne({
    where: { appointmentId: row.id },
  });

  if (income && normalized === "no-show" && income.paidStatus !== "paid") {
    income.paidStatus = "void";
    income.paymentMethod = null;
    income.amountFinal = 0;
    income.paidAt = null;
    await income.save();
  }

  return row;
}

export async function cancelAppointment({ appointmentId }) {
  const business = await getMainBusiness();

  const row = await Appointment.findByPk(appointmentId);

  if (!row) {
    throw new AppError("Turno no encontrado.", 404);
  }

  row.status = "cancelled";
  await row.save();

  const income = await Income.findOne({
    where: { appointmentId: row.id },
  });

  if (income && income.paidStatus !== "paid") {
    income.paidStatus = "void";
    income.paymentMethod = null;
    income.amountFinal = 0;
    income.paidAt = null;
    await income.save();
  }

  const serialized = serializeAppointment(row);

  if (serialized.clientEmail) {
    fireAndForget(() =>
      sendAppointmentCancellationEmail({
        appointment: serialized,
        businessName: business.publicName || env.businessPublicName,
        businessWhatsapp: business.whatsapp || env.businessWhatsapp,
      })
    );
  }

  return row;
}

export async function rescheduleAppointment({
  appointmentId,
  newStartAtISO,
  newStaffId,
}) {
  const business = await getMainBusiness();

  const row = await Appointment.findByPk(appointmentId, {
    include: [
      { model: Service, as: "service" },
      { model: Staff, as: "staff" },
      { model: Client, as: "client" },
    ],
  });

  if (!row) {
    throw new AppError("Turno no encontrado.", 404);
  }

  if (row.status === "cancelled") {
    throw new AppError("No se puede reprogramar un turno cancelado.", 400);
  }

  const previousSerialized = serializeAppointment(row);
  const targetStaffId = safeString(newStaffId) || row.staffId;

  const { service, staff } = await getValidatedServiceAndStaff({
    serviceId: row.serviceId,
    staffId: targetStaffId,
  });

  const start = new Date(newStartAtISO);

  if (Number.isNaN(start.getTime())) {
    throw new AppError("La nueva fecha/hora es inválida.", 400);
  }

  const startBusiness = utcDateToBusinessDateTime(start, BUSINESS_TZ);

  if (!only00or30FromDateTime(startBusiness)) {
    throw new AppError("Los turnos solo pueden arrancar en :00 o :30.", 400);
  }

  const endBusiness = addMinutesToDateTime(startBusiness, Number(service.durationMin || 30));
  const endUTC = businessDateTimeToUTCDate(endBusiness);
  const dateStr = toBusinessDateStr(start, BUSINESS_TZ);

  await ensureSlotAvailable({
    businessId: row.businessId,
    staffId: targetStaffId,
    dateStr,
    startAt: start,
    endAt: endUTC,
    allowOverlap: false,
    excludeAppointmentId: row.id,
  });

  row.staffId = targetStaffId;
  row.staffName = staff.name;
  row.startAt = start;
  row.endAt = endUTC;
  row.status = "rescheduled";

  await row.save();

  const income = await Income.findOne({
    where: { appointmentId: row.id },
  });

  if (income) {
    income.date = dateStr;
    await income.save();
  }

  const updated = await Appointment.findByPk(row.id, {
    include: [
      { model: Client, as: "client" },
      { model: Service, as: "service" },
      { model: Staff, as: "staff" },
    ],
  });

  const updatedSerialized = serializeAppointment(updated);

  if (updatedSerialized.clientEmail) {
    fireAndForget(() =>
      sendAppointmentRescheduledEmail({
        previousAppointment: previousSerialized,
        updatedAppointment: updatedSerialized,
        businessName: business.publicName || env.businessPublicName,
        businessWhatsapp: business.whatsapp || env.businessWhatsapp,
      })
    );
  }

  return updatedSerialized;
}