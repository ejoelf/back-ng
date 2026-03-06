// src/config/env.js
import dotenv from "dotenv";

dotenv.config();

function requireEnv(name, fallback = "") {
  const value = process.env[name] ?? fallback;

  if (value === undefined || value === null || String(value).trim() === "") {
    throw new Error(`Falta la variable de entorno obligatoria: ${name}`);
  }

  return String(value).trim();
}

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseDatabaseUrl(url) {
  try {
    const u = new URL(url);

    // Neon suele pedir sslmode=require en query
    const sslmode = u.searchParams.get("sslmode");

    return {
      host: u.hostname,
      port: u.port ? Number(u.port) : 5432,
      database: u.pathname?.replace("/", "") || "",
      username: decodeURIComponent(u.username || ""),
      password: decodeURIComponent(u.password || ""),
      sslmode: sslmode || "",
    };
  } catch {
    throw new Error("DATABASE_URL inválida. Revisá el formato.");
  }
}

const databaseUrl = process.env.DATABASE_URL?.trim() || "";

let dbFromUrl = null;
if (databaseUrl) dbFromUrl = parseDatabaseUrl(databaseUrl);

export const env = {
  nodeEnv: process.env.NODE_ENV?.trim() || "development",
  port: toNumber(process.env.PORT, 4000),

  // Permitimos varios orígenes separados por coma
  frontendUrl: (process.env.FRONTEND_URL?.trim() || "http://localhost:5173"),

  // DB: acepta DATABASE_URL o DB_*
  databaseUrl,
  dbHost: dbFromUrl?.host || requireEnv("DB_HOST"),
  dbPort: dbFromUrl?.port ?? toNumber(process.env.DB_PORT, 5432),
  dbName: dbFromUrl?.database || requireEnv("DB_NAME"),
  dbUser: dbFromUrl?.username || requireEnv("DB_USER"),
  dbPassword: dbFromUrl?.password || requireEnv("DB_PASSWORD"),
  dbSslMode: dbFromUrl?.sslmode || (process.env.DB_SSLMODE?.trim() || ""),

  jwtAccessSecret: requireEnv("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: requireEnv("JWT_REFRESH_SECRET"),

  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES?.trim() || "15m",
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES?.trim() || "7d",
};

export const isProd = env.nodeEnv === "production";
export const isDev = env.nodeEnv === "development";