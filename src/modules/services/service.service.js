import {
  Service,
  Staff,
  ServiceStaff,
  Appointment,
  sequelize,
} from "../../database/models/index.js";

function normalizeAllowedStaffIds(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(Boolean).map((x) => String(x).trim()))];
}

function normalizeDisplayOrder(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function mapService(service) {
  return {
    id: service.id,
    businessId: service.businessId,
    code: service.code,
    name: service.name,
    durationMin: service.durationMin,
    price: service.price,
    imageUrl: service.imageUrl || "",
    displayOrder: Number(service.displayOrder ?? 0) || 0,
    isActive: Boolean(service.isActive),
    allowedStaffIds: Array.isArray(service.allowedStaff)
      ? service.allowedStaff.map((staff) => staff.id)
      : [],
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
}

export async function listServicesService() {
  const services = await Service.findAll({
    include: [
      {
        model: Staff,
        as: "allowedStaff",
        attributes: ["id"],
        through: { attributes: [] },
      },
    ],
    order: [
      ["displayOrder", "ASC"],
      ["createdAt", "ASC"],
    ],
  });

  return services.map(mapService);
}

export async function createServiceService(payload) {
  const transaction = await sequelize.transaction();

  try {
    const allowedStaffIds = normalizeAllowedStaffIds(payload.allowedStaffIds);

    const service = await Service.create(
      {
        businessId: payload.businessId,
        code: payload.code || null,
        name: payload.name,
        durationMin: payload.durationMin,
        price: payload.price,
        imageUrl: payload.imageUrl || "",
        displayOrder: normalizeDisplayOrder(payload.displayOrder),
        isActive: true,
      },
      { transaction }
    );

    if (allowedStaffIds.length > 0) {
      const rows = allowedStaffIds.map((staffId) => ({
        serviceId: service.id,
        staffId,
      }));

      await ServiceStaff.bulkCreate(rows, { transaction });
    }

    await transaction.commit();

    const created = await Service.findByPk(service.id, {
      include: [
        {
          model: Staff,
          as: "allowedStaff",
          attributes: ["id"],
          through: { attributes: [] },
        },
      ],
    });

    return mapService(created);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function updateServiceService(serviceId, payload) {
  const transaction = await sequelize.transaction();

  try {
    const service = await Service.findByPk(serviceId, { transaction });

    if (!service) {
      const err = new Error("Servicio no encontrado.");
      err.status = 404;
      throw err;
    }

    const allowedStaffIds = normalizeAllowedStaffIds(payload.allowedStaffIds);

    await service.update(
      {
        code: payload.code || null,
        name: payload.name,
        durationMin: payload.durationMin,
        price: payload.price,
        imageUrl: payload.imageUrl || "",
        displayOrder: normalizeDisplayOrder(payload.displayOrder),
      },
      { transaction }
    );

    await ServiceStaff.destroy({
      where: { serviceId },
      transaction,
    });

    if (allowedStaffIds.length > 0) {
      const rows = allowedStaffIds.map((staffId) => ({
        serviceId,
        staffId,
      }));

      await ServiceStaff.bulkCreate(rows, { transaction });
    }

    await transaction.commit();

    const updated = await Service.findByPk(serviceId, {
      include: [
        {
          model: Staff,
          as: "allowedStaff",
          attributes: ["id"],
          through: { attributes: [] },
        },
      ],
    });

    return mapService(updated);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function deleteServiceService(serviceId) {
  const service = await Service.findByPk(serviceId);

  if (!service) {
    const err = new Error("Servicio no encontrado.");
    err.status = 404;
    throw err;
  }

  const linkedAppointments = await Appointment.count({
    where: { serviceId },
  });

  if (linkedAppointments > 0) {
    const err = new Error(
      "No se puede eliminar este servicio porque tiene turnos asociados."
    );
    err.status = 400;
    throw err;
  }

  await ServiceStaff.destroy({ where: { serviceId } });
  await service.destroy();

  return true;
}
