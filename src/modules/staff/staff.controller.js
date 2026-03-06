import { ok, fail } from "../../utils/apiResponse.js";
import {
  listStaffService,
  getStaffByIdService,
  createStaffService,
  updateStaffService,
  deleteStaffService,
} from "./staff.service.js";
import { Business } from "../../database/models/index.js";

function normalizeString(value) {
  return String(value ?? "").trim();
}

function normalizeNullableString(value) {
  const text = String(value ?? "").trim();
  return text || "";
}

function normalizeNullableNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeSkills(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((x) => String(x).trim()).filter(Boolean))];
}

function normalizeScheduleOverride(value) {
  if (!value || typeof value !== "object") return null;

  const openDays = Array.isArray(value.openDays)
    ? value.openDays.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
    : [];

  const intervals = Array.isArray(value.intervals)
    ? value.intervals
        .map((item) => ({
          start: normalizeString(item?.start),
          end: normalizeString(item?.end),
        }))
        .filter((item) => item.start && item.end)
    : [];

  if (openDays.length === 0 || intervals.length === 0) {
    return null;
  }

  const stepMinutes = Number(value.stepMinutes);
  const bufferMin = Number(value.bufferMin);

  return {
    openDays,
    intervals,
    stepMinutes: Number.isFinite(stepMinutes) && stepMinutes > 0 ? stepMinutes : 30,
    bufferMin: Number.isFinite(bufferMin) && bufferMin >= 0 ? bufferMin : 0,
  };
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

function buildStaffPayload(body) {
  const firstName = normalizeNullableString(body.firstName);
  const lastName = normalizeNullableString(body.lastName);
  const fallbackName = normalizeNullableString(body.name);
  const fullName = `${firstName} ${lastName}`.trim() || fallbackName;

  return {
    name: fullName,
    firstName,
    lastName,
    age: normalizeNullableNumber(body.age),
    birthday: normalizeNullableString(body.birthday),
    phone: normalizeNullableString(body.phone),
    dni: normalizeNullableString(body.dni),
    address: normalizeNullableString(body.address),
    bio: normalizeNullableString(body.bio),
    photoUrl: normalizeNullableString(body.photoUrl),
    skills: normalizeSkills(body.skills),
    scheduleOverride: normalizeScheduleOverride(body.scheduleOverride),
    isOwner: Boolean(body.isOwner),
  };
}

function validateStaffPayload(payload) {
  if (!payload.name) {
    return "El nombre del staff es obligatorio.";
  }

  if (payload.age !== null && payload.age < 0) {
    return "La edad no puede ser negativa.";
  }

  return null;
}

export async function listStaffController(req, res, next) {
  try {
    const staff = await listStaffService();
    return ok(res, { staff }, 200);
  } catch (error) {
    return next(error);
  }
}

export async function getStaffByIdController(req, res, next) {
  try {
    const staffId = normalizeString(req.params.id);

    if (!staffId) {
      return fail(res, "Falta el id del staff.", 400);
    }

    const staffMember = await getStaffByIdService(staffId);

    return ok(res, { staff: staffMember }, 200);
  } catch (error) {
    return next(error);
  }
}

export async function createStaffController(req, res, next) {
  try {
    const payload = buildStaffPayload(req.body);
    const validationError = validateStaffPayload(payload);

    if (validationError) {
      return fail(res, validationError, 400);
    }

    payload.businessId = await getDefaultBusinessId();

    const staffMember = await createStaffService(payload);

    return ok(res, { staff: staffMember, message: "Staff creado correctamente." }, 201);
  } catch (error) {
    return next(error);
  }
}

export async function updateStaffController(req, res, next) {
  try {
    const staffId = normalizeString(req.params.id);

    if (!staffId) {
      return fail(res, "Falta el id del staff.", 400);
    }

    const payload = buildStaffPayload(req.body);
    const validationError = validateStaffPayload(payload);

    if (validationError) {
      return fail(res, validationError, 400);
    }

    const staffMember = await updateStaffService(staffId, payload);

    return ok(res, { staff: staffMember, message: "Staff actualizado correctamente." }, 200);
  } catch (error) {
    return next(error);
  }
}

export async function deleteStaffController(req, res, next) {
  try {
    const staffId = normalizeString(req.params.id);

    if (!staffId) {
      return fail(res, "Falta el id del staff.", 400);
    }

    await deleteStaffService(staffId);

    return ok(res, { message: "Staff eliminado correctamente." }, 200);
  } catch (error) {
    return next(error);
  }
}