import { User } from "../../database/models/index.js";
import { AppError } from "../../utils/app-error.js";
import { hashPassword } from "../../utils/password.js";

function safeTrim(value) {
  return String(value ?? "").trim();
}

function serializeUser(row) {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    isActive: Boolean(row.isActive),
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getMe({ userId }) {
  if (!userId) {
    throw new AppError("No se pudo identificar al usuario autenticado.", 401);
  }

  const row = await User.findByPk(userId);

  if (!row || !row.isActive) {
    throw new AppError("Usuario no encontrado.", 404);
  }

  return serializeUser(row);
}

export async function updateCredentials({ userId, username, password }) {
  if (!userId) {
    throw new AppError("No se pudo identificar al usuario autenticado.", 401);
  }

  const row = await User.findByPk(userId);

  if (!row || !row.isActive) {
    throw new AppError("Usuario no encontrado.", 404);
  }

  const nextUsername = safeTrim(username);
  const nextPassword = safeTrim(password);

  if (!nextUsername) {
    throw new AppError("El nombre de usuario no puede estar vacío.", 400);
  }

  const clash = await User.findOne({
    where: { username: nextUsername },
  });

  if (clash && clash.id !== row.id) {
    throw new AppError("Ese nombre de usuario ya está en uso.", 400);
  }

  row.username = nextUsername;

  if (nextPassword) {
    if (nextPassword.length < 6) {
      throw new AppError("La contraseña debe tener al menos 6 caracteres.", 400);
    }

    row.passwordHash = await hashPassword(nextPassword);
  }

  await row.save();

  return serializeUser(row);
}