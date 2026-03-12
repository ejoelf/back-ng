import { Business, Client } from "../../database/models/index.js";
import { AppError } from "../../utils/app-error.js";

function safeTrim(value) {
  return String(value ?? "").trim();
}

function capitalizeWords(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isValidEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function normalizeTags(input) {
  if (!input) return [];

  if (Array.isArray(input)) {
    return [...new Set(input.map((x) => safeTrim(x)).filter(Boolean))];
  }

  if (typeof input === "string") {
    return [...new Set(input.split(",").map((x) => safeTrim(x)).filter(Boolean))];
  }

  return [];
}

function serializeClient(row) {
  return {
    id: row.id,
    businessId: row.businessId,
    name: row.name || "",
    phone: row.phone || "",
    email: row.email || "",
    birthday: row.birthday || "",
    notes: row.notes || "",
    tags: Array.isArray(row.tagsJson) ? row.tagsJson : [],
    isDeleted: Boolean(row.isDeleted),
    deletedAt: row.deletedAt || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
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

export async function listClients() {
  const rows = await Client.findAll({
    where: { isDeleted: false },
    order: [["name", "ASC"]],
  });

  return rows.map(serializeClient);
}

export async function createClient(payload) {
  const business = await getMainBusiness();

  const name = capitalizeWords(payload?.name);
  const phone = safeTrim(payload?.phone);
  const email = safeTrim(payload?.email);
  const birthday = safeTrim(payload?.birthday);
  const notes = safeTrim(payload?.notes);
  const tags = normalizeTags(payload?.tags);

  if (!name) {
    throw new AppError("El nombre es obligatorio.", 400);
  }

  if (!phone) {
    throw new AppError("El teléfono/WhatsApp es obligatorio.", 400);
  }

  if (!isValidEmail(email)) {
    throw new AppError("El email no es válido.", 400);
  }

  const existing = await Client.findOne({
    where: {
      businessId: business.id,
      phone,
      isDeleted: false,
    },
  });

  if (existing) {
    throw new AppError("Ya existe un cliente con ese teléfono.", 400);
  }

  const row = await Client.create({
    businessId: business.id,
    name,
    phone,
    email: email || null,
    birthday: birthday || null,
    notes: notes || "",
    tagsJson: tags,
    isDeleted: false,
    deletedAt: null,
  });

  return serializeClient(row);
}

export async function updateClient(clientId, payload) {
  const row = await Client.findByPk(clientId);

  if (!row || row.isDeleted) {
    throw new AppError("Cliente no encontrado.", 404);
  }

  const nextName =
    payload?.name != null ? capitalizeWords(payload.name) : capitalizeWords(row.name);

  const nextPhone =
    payload?.phone != null ? safeTrim(payload.phone) : safeTrim(row.phone);

  const nextEmail =
    payload?.email != null ? safeTrim(payload.email) : safeTrim(row.email);

  const nextBirthday =
    payload?.birthday != null ? safeTrim(payload.birthday) : safeTrim(row.birthday);

  const nextNotes =
    payload?.notes != null ? safeTrim(payload.notes) : safeTrim(row.notes);

  const nextTags =
    payload?.tags != null
      ? normalizeTags(payload.tags)
      : Array.isArray(row.tagsJson)
        ? row.tagsJson
        : [];

  if (!nextName) {
    throw new AppError("El nombre es obligatorio.", 400);
  }

  if (!nextPhone) {
    throw new AppError("El teléfono/WhatsApp es obligatorio.", 400);
  }

  if (!isValidEmail(nextEmail)) {
    throw new AppError("El email no es válido.", 400);
  }

  const clash = await Client.findOne({
    where: {
      businessId: row.businessId,
      phone: nextPhone,
      isDeleted: false,
    },
  });

  if (clash && clash.id !== row.id) {
    throw new AppError("Ya existe otro cliente con ese teléfono.", 400);
  }

  row.name = nextName;
  row.phone = nextPhone;
  row.email = nextEmail || null;
  row.birthday = nextBirthday || null;
  row.notes = nextNotes || "";
  row.tagsJson = nextTags;

  await row.save();

  return serializeClient(row);
}

export async function deleteClient(clientId) {
  const row = await Client.findByPk(clientId);

  if (!row || row.isDeleted) {
    throw new AppError("Cliente no encontrado.", 404);
  }

  row.isDeleted = true;
  row.deletedAt = new Date();

  await row.save();

  return { ok: true };
}