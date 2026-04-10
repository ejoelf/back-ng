import { ok } from "../../utils/apiResponse.js";
import { env } from "../../config/env.js";
import {
  getAvailability,
  listAppointmentsByDate,
  listAppointments,
  createAppointment,
  updateAppointmentStatus,
  cancelAppointment,
  rescheduleAppointment,
  getAppointmentByCode,
  cancelAppointmentByCode,
  rescheduleAppointmentByCode,
} from "./appointments.service.js";
import { sendAppointmentConfirmationEmail } from "../../utils/mailer.js";

function safeString(value) {
  return value == null ? "" : String(value).trim();
}

function fireAndForget(promiseFactory) {
  Promise.resolve()
    .then(() => promiseFactory())
    .catch((error) => {
      console.error("[mail] No se pudo enviar el email de confirmación:", error);
    });
}

async function trySendAppointmentEmail(appointment) {
  return sendAppointmentConfirmationEmail({
    appointment,
    businessName: env.businessPublicName,
    businessWhatsapp: env.businessWhatsapp,
  });
}

export async function getPublicAvailabilityController(req, res, next) {
  try {
    const { dateStr, serviceId, staffId } = req.query;

    if (!dateStr || !serviceId || !staffId) {
      return res.status(400).json({
        ok: false,
        error: {
          message: "Faltan datos para obtener disponibilidad.",
        },
      });
    }

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

    const clientEmail = safeString(client?.email);

    if (!clientEmail) {
      return res.status(400).json({
        ok: false,
        error: {
          message: "El email del cliente es obligatorio.",
        },
      });
    }

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
        email: clientEmail,
      },
    });

    if (clientEmail) {
      fireAndForget(() => trySendAppointmentEmail(appointment));
    }

    return ok(
      res,
      {
        message: "Turno creado correctamente.",
        appointment,
        emailNotification: clientEmail
          ? {
              sent: false,
              queued: true,
              skipped: false,
              reason: null,
            }
          : {
              sent: false,
              queued: false,
              skipped: true,
              reason: "missing-recipient",
            },
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
      sendEmailNotification,
      client,
      clientName,
      clientPhone,
      clientEmail,
    } = req.body;

    const fallbackName =
      client?.name ||
      clientName ||
      `${String(client?.firstName || "").trim()} ${String(client?.lastName || "").trim()}`.trim();

    const finalClientEmail = safeString(client?.email || clientEmail);

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
        email: finalClientEmail,
      },
    });

    let emailNotification = {
      sent: false,
      queued: false,
      skipped: true,
      reason: finalClientEmail ? "manual-opt-out" : "missing-recipient",
    };

    if (finalClientEmail && Boolean(sendEmailNotification)) {
      fireAndForget(() => trySendAppointmentEmail(appointment));
      emailNotification = {
        sent: false,
        queued: true,
        skipped: false,
        reason: null,
      };
    }

    return ok(
      res,
      {
        message: "Turno creado correctamente.",
        appointment,
        emailNotification,
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

export async function getAppointmentByCodeController(req, res, next) {
  try {
    const code = safeString(req.params?.code || req.query?.code);

    const appointment = await getAppointmentByCode({ code });

    return ok(res, { appointment });
  } catch (error) {
    return next(error);
  }
}

export async function cancelAppointmentByCodeController(req, res, next) {
  try {
    const { code } = req.body;

    await cancelAppointmentByCode({ code });

    return ok(res, {
      message: "Turno cancelado correctamente.",
    });
  } catch (error) {
    return next(error);
  }
}

export async function rescheduleAppointmentByCodeController(req, res, next) {
  try {
    const { code, newStartAtISO, newStaffId } = req.body;

    const appointment = await rescheduleAppointmentByCode({
      code,
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