// src/config/cors.js
import { env } from "./env.js";

function normalizeOrigin(o) {
  return String(o || "").trim().replace(/\/$/, "");
}

function parseAllowedOrigins(raw) {
  // FRONTEND_URL puede ser uno o varios separados por coma
  return String(raw || "")
    .split(",")
    .map((x) => normalizeOrigin(x))
    .filter(Boolean);
}

export const corsOptions = {
  origin(origin, callback) {
    // Permite requests sin origin (Postman, curl, healthchecks)
    if (!origin) return callback(null, true);

    const incoming = normalizeOrigin(origin);

    const allowed = [
      "http://localhost:5173",
      ...parseAllowedOrigins(env.frontendUrl),
    ].map(normalizeOrigin);

    if (allowed.includes(incoming)) return callback(null, true);

    return callback(new Error("Origen no permitido por CORS."));
  },
  credentials: true,
};