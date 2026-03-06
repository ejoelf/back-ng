import { Staff, Business, Block, RecurringBlock, ServiceStaff } from "../../database/models/index.js";

function toPlain(row) {
  return row ? row.get({ plain: true }) : null;
}

function normalizeStaffResponse(row) {
  if (!row) return null;

  const data = toPlain(row);

  return {
    id: data.id,
    businessId: data.businessId,
    name: data.name,
    firstName: data.firstName || "",
    lastName: data.lastName || "",
    age: data.age ?? "",
    birthday: data.birthday || "",
    phone: data.phone || "",
    dni: data.dni || "",
    address: data.address || "",
    bio: data.bio || "",
    photoUrl: data.photoUrl || "",
    skills: Array.isArray(data.skillsJson) ? data.skillsJson : [],
    scheduleOverride: data.scheduleOverrideJson || null,
    isOwner: Boolean(data.isOwner),
    isActive: Boolean(data.isActive),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

async function ensureBusinessExists(businessId) {
  const business = await Business.findByPk(businessId);

  if (!business) {
    const err = new Error("El negocio indicado no existe.");
    err.status = 400;
    throw err;
  }
}

async function ensureStaffExists(staffId) {
  const staff = await Staff.findByPk(staffId);

  if (!staff) {
    const err = new Error("El staff indicado no existe.");
    err.status = 404;
    throw err;
  }

  return staff;
}

export async function listStaffService() {
  const rows = await Staff.findAll({
    where: { isActive: true },
    order: [
      ["isOwner", "DESC"],
      ["name", "ASC"],
    ],
  });

  return rows.map(normalizeStaffResponse);
}

export async function getStaffByIdService(staffId) {
  const row = await ensureStaffExists(staffId);
  return normalizeStaffResponse(row);
}

export async function createStaffService(payload) {
  await ensureBusinessExists(payload.businessId);

  const row = await Staff.create({
    businessId: payload.businessId,
    name: payload.name,
    firstName: payload.firstName || null,
    lastName: payload.lastName || null,
    age: payload.age ?? null,
    birthday: payload.birthday || null,
    phone: payload.phone || null,
    dni: payload.dni || null,
    address: payload.address || null,
    bio: payload.bio || "",
    photoUrl: payload.photoUrl || "",
    skillsJson: Array.isArray(payload.skills) ? payload.skills : [],
    scheduleOverrideJson: payload.scheduleOverride || null,
    isOwner: Boolean(payload.isOwner),
    isActive: true,
  });

  return normalizeStaffResponse(row);
}

export async function updateStaffService(staffId, payload) {
  const row = await ensureStaffExists(staffId);

  await row.update({
    name: payload.name,
    firstName: payload.firstName || null,
    lastName: payload.lastName || null,
    age: payload.age ?? null,
    birthday: payload.birthday || null,
    phone: payload.phone || null,
    dni: payload.dni || null,
    address: payload.address || null,
    bio: payload.bio || "",
    photoUrl: payload.photoUrl || "",
    skillsJson: Array.isArray(payload.skills) ? payload.skills : [],
    scheduleOverrideJson: payload.scheduleOverride || null,
    isOwner: Boolean(payload.isOwner),
  });

  return normalizeStaffResponse(row);
}

export async function deleteStaffService(staffId) {
  const row = await ensureStaffExists(staffId);

  const [blocksCount, recurringBlocksCount, serviceLinksCount] = await Promise.all([
    Block.count({ where: { staffId } }),
    RecurringBlock.count({ where: { staffId } }),
    ServiceStaff.count({ where: { staffId } }),
  ]);

  if (blocksCount > 0 || recurringBlocksCount > 0 || serviceLinksCount > 0) {
    await Promise.all([
      Block.update({ staffId: null }, { where: { staffId } }),
      RecurringBlock.update({ staffId: null }, { where: { staffId } }),
      ServiceStaff.destroy({ where: { staffId } }),
    ]);
  }

  await row.destroy();

  return true;
}