import { Op } from "sequelize";
import { Income, Appointment, Business, Staff } from "../../database/models/index.js";
import { AppError } from "../../utils/app-error.js";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function todayLocalISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function safeString(value) {
  return value == null ? "" : String(value).trim();
}

function parseISODate(value, fieldName = "fecha") {
  const v = safeString(value);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    throw new AppError(`La ${fieldName} es inválida. Usá formato YYYY-MM-DD.`, 400);
  }

  const [y, m, d] = v.split("-").map(Number);
  const dt = new Date(y, m - 1, d, 0, 0, 0, 0);

  if (Number.isNaN(dt.getTime())) {
    throw new AppError(`La ${fieldName} es inválida.`, 400);
  }

  return v;
}

function normalizePaymentMethod(method) {
  const v = safeString(method).toLowerCase();

  if (!v) return null;

  const allowed = ["cash", "transfer", "qr", "debit", "credit", "other"];
  if (allowed.includes(v)) return v;

  if (v.includes("efect")) return "cash";
  if (v.includes("transf")) return "transfer";
  if (v.includes("qr")) return "qr";
  if (v.includes("deb")) return "debit";
  if (v.includes("cred")) return "credit";
  if (v.includes("tarj")) return "credit";

  return "other";
}

function normalizePaidStatus(status) {
  const v = safeString(status).toLowerCase();
  const allowed = ["pending", "paid", "void", "unpaid"];

  if (!allowed.includes(v)) {
    throw new AppError("El estado de cobro es inválido.", 400);
  }

  return v;
}

function timeHHMM(dateLike) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function serializeIncome(row) {
  const appointment = row.appointment || null;
  const appointmentStaff = appointment?.staff || null;

  return {
    id: row.id,
    appointmentId: row.appointmentId,
    serviceId: row.serviceId,
    businessId: row.businessId,
    date: row.date,
    clientName: row.clientName || "—",
    serviceName: row.serviceName || "—",
    amountEstimated: Number(row.amountEstimated ?? 0) || 0,
    amountFinal: row.amountFinal == null ? null : Number(row.amountFinal ?? 0) || 0,
    paymentMethod: row.paymentMethod || null,
    paidStatus: row.paidStatus || "pending",
    detail: row.detail || "",
    paidAt: row.paidAt || null,

    appointmentStartAt: appointment?.startAt || null,
    appointmentTime: appointment?.startAt ? timeHHMM(appointment.startAt) : "",
    staffName:
      row.staffName ||
      appointment?.staffName ||
      appointmentStaff?.name ||
      "",
  };
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

export async function getIncomeByAppointmentId({ appointmentId }) {
  const business = await getMainBusiness();

  const row = await Income.findOne({
    where: {
      businessId: business.id,
      appointmentId,
    },
    include: [
      {
        model: Appointment,
        as: "appointment",
        include: [{ model: Staff, as: "staff" }],
      },
    ],
  });

  if (!row) return null;
  return serializeIncome(row);
}

export async function listIncomesByDate({ dateStr }) {
  const business = await getMainBusiness();
  const cleanDate = parseISODate(dateStr);

  const rows = await Income.findAll({
    where: {
      businessId: business.id,
      date: cleanDate,
    },
    include: [
      {
        model: Appointment,
        as: "appointment",
        include: [{ model: Staff, as: "staff" }],
      },
    ],
    order: [
      ["date", "ASC"],
      ["createdAt", "ASC"],
    ],
  });

  return rows.map(serializeIncome);
}

export async function getClientsDebtStatus() {
  const business = await getMainBusiness();
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const rows = await Income.findAll({
    where: {
      businessId: business.id,
      clientName: {
        [Op.ne]: "Caja",
      },
    },
    order: [
      ["date", "DESC"],
      ["createdAt", "DESC"],
    ],
  });

  const result = {};

  for (const row of rows) {
    const clientName = safeString(row.clientName);
    if (!clientName) continue;

    if (!result[clientName]) {
      result[clientName] = "green";
    }

    if (row.paidStatus === "paid" || row.paidStatus === "void") {
      continue;
    }

    const rowDate = safeString(row.date);
    if (!rowDate) {
      result[clientName] = "red";
      continue;
    }

    const d = new Date(`${rowDate}T00:00:00`);
    if (Number.isNaN(d.getTime())) {
      result[clientName] = "red";
      continue;
    }

    const sameMonth =
      d.getFullYear() === currentYear && d.getMonth() === currentMonth;

    if (sameMonth) {
      if (result[clientName] !== "red") {
        result[clientName] = "orange";
      }
    } else {
      result[clientName] = "red";
    }
  }

  return result;
}

export async function markIncomePaid({
  incomeId,
  paymentMethod,
  amountFinal,
  paidDateStr,
}) {
  const business = await getMainBusiness();

  const row = await Income.findOne({
    where: {
      id: incomeId,
      businessId: business.id,
    },
  });

  if (!row) {
    throw new AppError("Ingreso no encontrado.", 404);
  }

  if (row.paidStatus === "void") {
    throw new AppError("No se puede cobrar un ingreso anulado.", 400);
  }

  if (row.paidStatus === "paid") {
    throw new AppError("Ese ingreso ya está cobrado.", 400);
  }

  const method = normalizePaymentMethod(paymentMethod);
  if (!method) {
    throw new AppError("Elegí un método de pago válido.", 400);
  }

  const amount = Number(amountFinal);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new AppError("El monto final es inválido.", 400);
  }

  const targetDate = safeString(paidDateStr)
    ? parseISODate(paidDateStr, "fecha de cobro")
    : todayLocalISO();

  row.paidStatus = "paid";
  row.paymentMethod = method;
  row.amountFinal = amount;
  row.date = targetDate;
  row.paidAt = new Date();

  await row.save();

  if (row.appointmentId) {
    const appt = await Appointment.findByPk(row.appointmentId);

    if (appt && appt.status !== "cancelled") {
      appt.status = "completed";
      await appt.save();
    }
  }

  const updated = await Income.findByPk(row.id, {
    include: [
      {
        model: Appointment,
        as: "appointment",
        include: [{ model: Staff, as: "staff" }],
      },
    ],
  });

  return serializeIncome(updated);
}

export async function setIncomeStatus({ incomeId, paidStatus }) {
  const business = await getMainBusiness();
  const normalized = normalizePaidStatus(paidStatus);

  if (normalized === "paid") {
    throw new AppError("Para marcar como cobrado usá el flujo de cobro.", 400);
  }

  const row = await Income.findOne({
    where: {
      id: incomeId,
      businessId: business.id,
    },
  });

  if (!row) {
    throw new AppError("Ingreso no encontrado.", 404);
  }

  if (row.paidStatus === "paid" && normalized !== "paid") {
    throw new AppError("No se puede cambiar manualmente el estado de un ingreso ya cobrado.", 400);
  }

  if (row.paidStatus === "void" && normalized === "unpaid") {
    throw new AppError("Un ingreso anulado no puede pasar a 'No cobrado'.", 400);
  }

  row.paidStatus = normalized;

  if (normalized === "void") {
    row.amountFinal = 0;
    row.paymentMethod = null;
    row.paidAt = null;
  }

  if (normalized === "pending" || normalized === "unpaid") {
    row.amountFinal = null;
    row.paymentMethod = null;
    row.paidAt = null;
  }

  await row.save();

  const updated = await Income.findByPk(row.id, {
    include: [
      {
        model: Appointment,
        as: "appointment",
        include: [{ model: Staff, as: "staff" }],
      },
    ],
  });

  return serializeIncome(updated);
}

export async function createManualIncome({
  concept,
  amountFinal,
  paymentMethod,
  paidDateStr,
}) {
  const business = await getMainBusiness();

  const conceptText = safeString(concept) || "Otro";
  const method = normalizePaymentMethod(paymentMethod);

  if (!method) {
    throw new AppError("Elegí un método de pago válido.", 400);
  }

  const amount = Number(amountFinal);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError("El monto es inválido.", 400);
  }

  const targetDate = safeString(paidDateStr)
    ? parseISODate(paidDateStr, "fecha")
    : todayLocalISO();

  const row = await Income.create({
    businessId: business.id,
    appointmentId: null,
    serviceId: null,
    date: targetDate,
    clientName: "Caja",
    serviceName: conceptText,
    amountEstimated: amount,
    amountFinal: amount,
    paymentMethod: method,
    paidStatus: "paid",
    detail: conceptText,
    paidAt: new Date(),
  });

  return serializeIncome(row);
}

export async function listIncomesByRange({ from, to }) {
  const business = await getMainBusiness();

  const cleanFrom = parseISODate(from, "fecha desde");
  const cleanTo = parseISODate(to, "fecha hasta");

  if (cleanTo < cleanFrom) {
    throw new AppError("El rango de fechas es inválido.", 400);
  }

  const rows = await Income.findAll({
    where: {
      businessId: business.id,
      date: {
        [Op.gte]: cleanFrom,
        [Op.lte]: cleanTo,
      },
    },
    include: [
      {
        model: Appointment,
        as: "appointment",
        include: [{ model: Staff, as: "staff" }],
      },
    ],
    order: [
      ["date", "ASC"],
      ["createdAt", "ASC"],
    ],
  });

  return rows.map(serializeIncome);
}