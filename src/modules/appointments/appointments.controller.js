import { ok } from "../../utils/apiResponse.js";
import {
  getAvailability,
  listAppointmentsByDate,
  listAppointments,
  createAppointment,
  updateAppointmentStatus,
  cancelAppointment,
  rescheduleAppointment,
} from "./appointments.service.js";

export async function getPublicAvailabilityController(req, res, next) {
  try {
    const { dateStr, serviceId, staffId } = req.query;

    const slots = await getAvailability({
      dateStr,
      serviceId,
      staffId,
    });

    return ok(res, { slots });
  } catch (error) {
    return next(error);
  }
}

export async function getAppointmentsAvailableController(req, res, next) {
  try {
    const { dateStr, serviceId, staffId } = req.query;

    const slots = await getAvailability({
      dateStr,
      serviceId,
      staffId,
    });

    return ok(res, { slots });
  } catch (error) {
    return next(error);
  }
}

export async function listAppointmentsByDateController(req, res, next) {
  try {
    const { dateStr, staffId } = req.query;

    const appointments = await listAppointmentsByDate({
      dateStr,
      staffId,
    });

    return ok(res, { appointments });
  } catch (error) {
    return next(error);
  }
}

export async function listAppointmentsController(req, res, next) {
  try {
    const { clientId } = req.query;

    const appointments = await listAppointments({
      clientId,
    });

    return ok(res, { appointments });
  } catch (error) {
    return next(error);
  }
}

export async function createPublicAppointmentController(req, res, next) {
  try {
    const { serviceId, staffId, startAt, notes, channel, client } = req.body;

    const appointment = await createAppointment({
      serviceId,
      staffId,
      startAt,
      notes,
      channel: channel || "web",
      allowOverlap: false,
      client: {
        name:
          client?.name ||
          `${String(client?.firstName || "").trim()} ${String(client?.lastName || "").trim()}`.trim(),
        phone: client?.phone,
        email: client?.email,
      },
    });

    return ok(
      res,
      {
        message: "Turno creado correctamente.",
        appointment,
      },
      201
    );
  } catch (error) {
    return next(error);
  }
}

export async function createManualAppointmentController(req, res, next) {
  try {
    const {
      serviceId,
      staffId,
      startAt,
      notes,
      channel,
      allowOverlap,
      client,
      clientName,
      clientPhone,
      clientEmail,
    } = req.body;

    const fallbackName =
      client?.name ||
      clientName ||
      `${String(client?.firstName || "").trim()} ${String(client?.lastName || "").trim()}`.trim();

    const appointment = await createAppointment({
      serviceId,
      staffId,
      startAt,
      notes,
      channel: channel || "manual",
      allowOverlap: Boolean(allowOverlap),
      client: {
        name: fallbackName,
        phone: client?.phone || clientPhone,
        email: client?.email || clientEmail,
      },
    });

    return ok(
      res,
      {
        message: "Turno creado correctamente.",
        appointment,
      },
      201
    );
  } catch (error) {
    return next(error);
  }
}

export async function updateAppointmentStatusController(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await updateAppointmentStatus({
      appointmentId: id,
      status,
    });

    return ok(res, {
      message: "Estado del turno actualizado correctamente.",
    });
  } catch (error) {
    return next(error);
  }
}

export async function cancelAppointmentController(req, res, next) {
  try {
    const { id } = req.params;

    await cancelAppointment({
      appointmentId: id,
    });

    return ok(res, {
      message: "Turno cancelado correctamente.",
    });
  } catch (error) {
    return next(error);
  }
}

export async function rescheduleAppointmentController(req, res, next) {
  try {
    const { id } = req.params;
    const { newStartAtISO, newStaffId } = req.body;

    const appointment = await rescheduleAppointment({
      appointmentId: id,
      newStartAtISO,
      newStaffId,
    });

    return ok(res, {
      message: "Turno reprogramado correctamente.",
      appointment,
    });
  } catch (error) {
    return next(error);
  }
}