import { User, Business } from "../../database/models/index.js";
import { AppError } from "../../utils/app-error.js";
import { comparePassword, hashPassword } from "../../utils/password.js";
import { signAccessToken, signRefreshToken } from "../../utils/jwt.js";

function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
  };
}

function sanitizeBusiness(business) {
  if (!business) return null;

  return {
    id: business.id,
    name: business.name,
    address: business.address,
    whatsapp: business.whatsapp,
  };
}

export async function loginUser({ username, password }) {
  const cleanUsername = String(username || "").trim();
  const cleanPassword = String(password || "").trim();

  if (!cleanUsername || !cleanPassword) {
    throw new AppError("Completá usuario y contraseña.", 400);
  }

  const user = await User.findOne({
    where: { username: cleanUsername },
  });

  if (!user) {
    throw new AppError("Usuario o contraseña incorrectos.", 401);
  }

  if (!user.isActive) {
    throw new AppError("Tu usuario está inactivo. Contactá al administrador.", 403);
  }

  const matches = await comparePassword(cleanPassword, user.passwordHash);

  if (!matches) {
    throw new AppError("Usuario o contraseña incorrectos.", 401);
  }

  user.lastLoginAt = new Date();
  await user.save();

  const business = await Business.findOne({
    order: [["createdAt", "ASC"]],
  });

  const accessToken = signAccessToken({
    userId: user.id,
    username: user.username,
    role: user.role,
  });

  const refreshToken = signRefreshToken({
    userId: user.id,
    username: user.username,
    role: user.role,
  });

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user),
    business: sanitizeBusiness(business),
  };
}

export async function getCurrentSession({ userId }) {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new AppError("Usuario no encontrado.", 404);
  }

  const business = await Business.findOne({
    order: [["createdAt", "ASC"]],
  });

  return {
    user: sanitizeUser(user),
    business: sanitizeBusiness(business),
  };
}

export async function updateCredentials({ userId, username, password }) {
  const cleanUsername = String(username || "").trim();
  const cleanPassword = String(password || "");

  if (!cleanUsername) {
    throw new AppError("El usuario no puede estar vacío.", 400);
  }

  const user = await User.findByPk(userId);

  if (!user) {
    throw new AppError("Usuario no encontrado.", 404);
  }

  const existing = await User.findOne({
    where: { username: cleanUsername },
  });

  if (existing && existing.id !== user.id) {
    throw new AppError("Ese nombre de usuario ya está en uso.", 409);
  }

  user.username = cleanUsername;

  if (cleanPassword.trim()) {
    if (cleanPassword.trim().length < 6) {
      throw new AppError("La contraseña debe tener al menos 6 caracteres.", 400);
    }

    user.passwordHash = await hashPassword(cleanPassword.trim());
  }

  await user.save();

  return {
    user: sanitizeUser(user),
  };
}