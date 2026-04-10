import { Op } from "sequelize";
import { Appointment, Service, Staff } from "../../database/models/index.js";
import { toBusinessDateStr } from "../../utils/datetime.js";

const BUSINESS_TZ = "America/Argentina/Cordoba";

function safeString(value) {
  return value == null ? "" : String(value).trim();
}

export async function searchPublicAppointments(req, res) {
  try {
    const name = safeString(req.body?.name);
    const phone = safeString(req.body?.phone);

    if (!name || !phone) {
      return res.status(400).json({
        ok: false,
        message: "Faltan datos",
      });
    }

    const now = new Date();

    const appointments = await Appointment.findAll({
      where: {
        startAt: { [Op.gte]: now },
        status: { [Op.ne]: "cancelled" },
        clientPhone: phone,
        clientName: {
          [Op.iLike]: `%${name}%`,
        },
      },
      include: [
        {
          model: Service,
          as: "service",
        },
        {
          model: Staff,
          as: "staff",
        },
      ],
      order: [["startAt", "ASC"]],
      limit: 10,
    });

    const result = appointments.map((a) => ({
      id: a.id,
      confirmationCode: a.confirmationCode || "",
      startAt: a.startAt,
      dateStr: a.startAt ? toBusinessDateStr(a.startAt, BUSINESS_TZ) : "",
      status: a.status,

      clientName: a.clientName || "",
      clientPhone: a.clientPhone || "",

      serviceId: a.serviceId,
      staffId: a.staffId,

      serviceName: a.serviceName || a.service?.name || "Servicio",
      staffName: a.staffName || a.staff?.name || "Staff",
    }));

    return res.json({
      ok: true,
      appointments: result,
    });
  } catch (error) {
    console.error("❌ searchPublicAppointments:", error);

    return res.status(500).json({
      ok: false,
      message: "Error buscando turnos",
    });
  }
}