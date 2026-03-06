import { ok, fail } from "../../utils/apiResponse.js";
import {
  listServicesService,
  createServiceService,
  updateServiceService,
  deleteServiceService,
} from "./service.service.js";
import { Business, Staff } from "../../database/models/index.js";

function normalizeString(value) {
  return String(value ?? "").trim();
}

function normalizeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function getDefaultBusinessId() {
  const business = await Business.findOne({
    order: [["createdAt", "ASC"]],
  });

  if (!business) {
    const err = new Error("No existe un negocio cargado en la base de datos.");
    err.status = 400;
    throw err;
  }

  return business.id;
}

async function validateAllowedStaffIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return {
      ok: true,
      ids: [],
    };
  }

  const cleanIds = [...new Set(ids.map((x) => String(x).trim()).filter(Boolean))];

  const rows = await Staff.findAll({
    where: { id: cleanIds },
    attributes: ["id"],
  });

  const foundIds = rows.map((row) => row.id);
  const missing = cleanIds.filter((id) => !foundIds.includes(id));

  if (missing.length > 0) {
    return {
      ok: false,
      missing,
      ids: [],
    };
  }

  return {
    ok: true,
    ids: cleanIds,
  };
}

export async function listServicesController(req, res, next) {
  try {
    const services = await listServicesService();
    return ok(res, { services }, 200);
  } catch (error) {
    return next(error);
  }
}

export async function createServiceController(req, res, next) {
  try {
    const name = normalizeString(req.body.name);
    const code = normalizeString(req.body.code);
    const imageUrl = normalizeString(req.body.imageUrl);
    const durationMin = normalizeNumber(req.body.durationMin, 30);
    const price = normalizeNumber(req.body.price, 0);

    if (!name) {
      return fail(res, "El nombre del servicio es obligatorio.", 400);
    }

    if (durationMin <= 0) {
      return fail(res, "La duración debe ser mayor a 0 minutos.", 400);
    }

    if (price < 0) {
      return fail(res, "El precio no puede ser negativo.", 400);
    }

    const allowedCheck = await validateAllowedStaffIds(req.body.allowedStaffIds);

    if (!allowedCheck.ok) {
      return fail(res, "Hay staff inválido en la selección.", 400, {
        invalidStaffIds: allowedCheck.missing,
      });
    }

    const businessId = await getDefaultBusinessId();

    const service = await createServiceService({
      businessId,
      code,
      name,
      durationMin,
      price,
      imageUrl,
      allowedStaffIds: allowedCheck.ids,
    });

    return ok(res, { service, message: "Servicio creado correctamente." }, 201);
  } catch (error) {
    return next(error);
  }
}

export async function updateServiceController(req, res, next) {
  try {
    const serviceId = String(req.params.id || "").trim();
    const name = normalizeString(req.body.name);
    const code = normalizeString(req.body.code);
    const imageUrl = normalizeString(req.body.imageUrl);
    const durationMin = normalizeNumber(req.body.durationMin, 30);
    const price = normalizeNumber(req.body.price, 0);

    if (!serviceId) {
      return fail(res, "Falta el id del servicio.", 400);
    }

    if (!name) {
      return fail(res, "El nombre del servicio es obligatorio.", 400);
    }

    if (durationMin <= 0) {
      return fail(res, "La duración debe ser mayor a 0 minutos.", 400);
    }

    if (price < 0) {
      return fail(res, "El precio no puede ser negativo.", 400);
    }

    const allowedCheck = await validateAllowedStaffIds(req.body.allowedStaffIds);

    if (!allowedCheck.ok) {
      return fail(res, "Hay staff inválido en la selección.", 400, {
        invalidStaffIds: allowedCheck.missing,
      });
    }

    const service = await updateServiceService(serviceId, {
      code,
      name,
      durationMin,
      price,
      imageUrl,
      allowedStaffIds: allowedCheck.ids,
    });

    return ok(res, { service, message: "Servicio actualizado correctamente." }, 200);
  } catch (error) {
    return next(error);
  }
}

export async function deleteServiceController(req, res, next) {
  try {
    const serviceId = String(req.params.id || "").trim();

    if (!serviceId) {
      return fail(res, "Falta el id del servicio.", 400);
    }

    await deleteServiceService(serviceId);

    return ok(res, { message: "Servicio eliminado correctamente." }, 200);
  } catch (error) {
    return next(error);
  }
}