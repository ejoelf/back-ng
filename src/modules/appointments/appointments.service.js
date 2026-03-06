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

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toDateStrLocal(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseDateStr(dateStr) {
  const value = String(dateStr || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError("La fecha es inválida. Usá formato YYYY-MM-DD.", 400);
  }

  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(y, m - 1, d, 0, 0, 0, 0);

  if (Number.isNaN(dt.getTime())) {
    throw new AppError("La fecha es inválida.", 400);
  }

  return dt;
}

function parseHHMM(hhmm) {
  const value = String(hhmm || "").trim();

  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new AppError("El horario es inválido. Usá HH:MM.", 400);
  }

  const [h, m] = value.split(":").map(Number);

  if (
    !Number.isInteger(h) ||
    !Number.isInteger(m) ||
    h < 0 ||
    h > 23 ||
    m < 0 ||
    m > 59
  ) {
    throw new AppError("El horario es inválido.", 400);
  }

  return { h, m };
}

function combineDateAndTime(dateStr, hhmm) {
  const base = parseDateStr(dateStr);
  const { h, m } = parseHHMM(hhmm);
  base.setHours(h, m, 0, 0);
  return base;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + Number(minutes || 0) * 60000);
}

function timeHHMM(date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function safeString(value) {
  return value == null ? "" : String(value).trim();
}

function only00or30(date) {
  const m = date.getMinutes();
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
  const day = parseDateStr(dateStr).getDay();

  if (!schedule.openDays.includes(day)) return [];
  return schedule.intervals;
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
  const dayStart = combineDateAndTime(dateStr, "00:00");
  const dayEnd = addMinutes(dayStart, 24 * 60);

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
        dayOfWeek: parseDateStr(dateStr).getDay(),
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
    busy.push({
      startAt: combineDateAndTime(dateStr, b.start),
      endAt: combineDateAndTime(dateStr, b.end),
      type: "block",
      id: b.id,
    });
  }

  for (const rb of recurringBlocks) {
    busy.push({
      startAt: combineDateAndTime(dateStr, rb.start),
      endAt: combineDateAndTime(dateStr, rb.end),
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

    dateStr: row.startAt ? toDateStrLocal(new Date(row.startAt)) : "",
    start: row.startAt ? timeHHMM(new Date(row.startAt)) : "",
    end: row.endAt ? timeHHMM(new Date(row.endAt)) : "",
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
  const now = new Date();
  const todayStr = toDateStrLocal(now);

  const slots = [];

  for (const interval of intervals) {
    const intervalStart = combineDateAndTime(dateStrSafe, interval.start);
    const intervalEnd = combineDateAndTime(dateStrSafe, interval.end);

    let current = new Date(intervalStart);

    while (current < intervalEnd) {
      const slotStart = new Date(current);
      const slotEnd = addMinutes(slotStart, durationMin);

      const startsInsideWindow = slotStart >= intervalStart && slotStart < intervalEnd;
      const endsInsideWindow = slotEnd <= intervalEnd;
      const respectsHalfHour = only00or30(slotStart);
      const notPast = dateStrSafe !== todayStr || slotStart >= now;

      const collides = busyItems.some((item) =>
        overlaps(slotStart, slotEnd, item.startAt, item.endAt)
      );

      if (startsInsideWindow && endsInsideWindow && respectsHalfHour && notPast && !collides) {
        slots.push({
          startAt: slotStart.toISOString(),
          endAt: slotEnd.toISOString(),
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

  const dayStart = combineDateAndTime(dateStrSafe, "00:00");
  const dayEnd = addMinutes(dayStart, 24 * 60);

  const where = {
    businessId: business.id,
    startAt: {
      [Op.gte]: dayStart,
      [Op.lt]: dayEnd,
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
        name,
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

  if (!safeString(row.name)) patch.name = name;
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

  if (!only00or30(start)) {
    throw new AppError("Los turnos solo pueden arrancar en :00 o :30.", 400);
  }

  const businessId = service.businessId;
  const dateStr = toDateStrLocal(start);
  const end = addMinutes(start, Number(service.durationMin || 30));

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
      endAt: end,
      allowOverlap: Boolean(allowOverlap),
    });

    const appointment = await Appointment.create(
      {
        businessId,
        clientId: clientRow.id,
        serviceId: service.id,
        staffId: staff.id,
        startAt: start,
        endAt: end,
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

  return row;
}

export async function rescheduleAppointment({
  appointmentId,
  newStartAtISO,
  newStaffId,
}) {
  const row = await Appointment.findByPk(appointmentId, {
    include: [
      { model: Service, as: "service" },
      { model: Staff, as: "staff" },
    ],
  });

  if (!row) {
    throw new AppError("Turno no encontrado.", 404);
  }

  if (row.status === "cancelled") {
    throw new AppError("No se puede reprogramar un turno cancelado.", 400);
  }

  const targetStaffId = safeString(newStaffId) || row.staffId;

  const { service, staff } = await getValidatedServiceAndStaff({
    serviceId: row.serviceId,
    staffId: targetStaffId,
  });

  const start = new Date(newStartAtISO);

  if (Number.isNaN(start.getTime())) {
    throw new AppError("La nueva fecha/hora es inválida.", 400);
  }

  if (!only00or30(start)) {
    throw new AppError("Los turnos solo pueden arrancar en :00 o :30.", 400);
  }

  const end = addMinutes(start, Number(service.durationMin || 30));
  const dateStr = toDateStrLocal(start);

  await ensureSlotAvailable({
    businessId: row.businessId,
    staffId: targetStaffId,
    dateStr,
    startAt: start,
    endAt: end,
    allowOverlap: false,
    excludeAppointmentId: row.id,
  });

  row.staffId = targetStaffId;
  row.staffName = staff.name;
  row.startAt = start;
  row.endAt = end;
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

  return serializeAppointment(updated);
}