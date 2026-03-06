import { Op } from "sequelize";
import {
  Appointment,
  Income,
  Client,
  Service,
  Staff,
} from "../../database/models/index.js";
import { AppError } from "../../utils/app-error.js";

function safeTrim(value) {
  return String(value ?? "").trim();
}

function isValidISODate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(safeTrim(value));
}

function validateRange(from, to) {
  const fromDate = safeTrim(from);
  const toDate = safeTrim(to);

  if (!fromDate || !toDate) {
    throw new AppError("Debés enviar desde y hasta.", 400);
  }

  if (!isValidISODate(fromDate) || !isValidISODate(toDate)) {
    throw new AppError("Las fechas deben tener formato YYYY-MM-DD.", 400);
  }

  if (toDate < fromDate) {
    throw new AppError("El rango es inválido: 'hasta' no puede ser menor que 'desde'.", 400);
  }

  return { fromDate, toDate };
}

function startOfDay(dateStr) {
  return new Date(`${dateStr}T00:00:00`);
}

function nextDay(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return d;
}

export async function exportAppointments({ from, to }) {
  const { fromDate, toDate } = validateRange(from, to);

  const rows = await Appointment.findAll({
    where: {
      startAt: {
        [Op.gte]: startOfDay(fromDate),
        [Op.lt]: nextDay(toDate),
      },
    },
    include: [
      { model: Client, as: "client" },
      { model: Service, as: "service" },
      { model: Staff, as: "staff" },
    ],
    order: [
      ["startAt", "ASC"],
      ["createdAt", "ASC"],
    ],
  });

  return rows.map((row) => {
    const start = new Date(row.startAt);
    const end = new Date(row.endAt);

    const date = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
    const startHHMM = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;
    const endHHMM = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;

    return {
      id: row.id,
      date,
      start: startHHMM,
      end: endHHMM,
      service: row.serviceName || row.service?.name || "Servicio",
      client: row.clientName || row.client?.name || "Cliente",
      staff: row.staffName || row.staff?.name || "Staff",
      status: row.status || "confirmed",
      channel: row.channel || "web",
      price: Number(row.price ?? row.service?.price ?? 0) || 0,
    };
  });
}

export async function exportIncomes({ from, to }) {
  const { fromDate, toDate } = validateRange(from, to);

  const rows = await Income.findAll({
    where: {
      date: {
        [Op.gte]: fromDate,
        [Op.lte]: toDate,
      },
    },
    order: [
      ["date", "ASC"],
      ["createdAt", "ASC"],
    ],
  });

  return rows.map((row) => ({
    id: row.id,
    date: row.date,
    clientName: row.clientName || "—",
    serviceName: row.serviceName || "—",
    paidStatus: row.paidStatus || "pending",
    paymentMethod: row.paymentMethod || null,
    amountEstimated: Number(row.amountEstimated ?? 0) || 0,
    amountFinal: row.amountFinal == null ? null : Number(row.amountFinal ?? 0) || 0,
  }));
}