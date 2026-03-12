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

function toBoolean(value, fallback = false) {
  if (value == null || String(value).trim() === "") return fallback;

  const normalized = String(value).trim().toLowerCase();
  return ["1", "true", "yes", "on", "si", "sí"].includes(normalized);
}

function parseDatabaseUrl(url) {
  try {
    const u = new URL(url);

    return {
      host: u.hostname,
      port: u.port ? Number(u.port) : 5432,
      database: u.pathname?.replace("/", "") || "",
      username: decodeURIComponent(u.username || ""),
      password: decodeURIComponent(u.password || ""),
      sslmode: u.searchParams.get("sslmode") || "",
    };
  } catch {
    throw new Error("DATABASE_URL inválida. Revisá el formato.");
  }
}

const databaseUrl = process.env.DATABASE_URL?.trim() || "";
let dbFromUrl = null;

if (databaseUrl) {
  dbFromUrl = parseDatabaseUrl(databaseUrl);
}

export const env = {
  nodeEnv: process.env.NODE_ENV?.trim() || "development",
  port: toNumber(process.env.PORT, 4000),

  frontendUrl: process.env.FRONTEND_URL?.trim() || "http://localhost:5173",

  databaseUrl,
  dbHost: dbFromUrl?.host || requireEnv("DB_HOST"),
  dbPort: dbFromUrl?.port ?? toNumber(process.env.DB_PORT, 5432),
  dbName: dbFromUrl?.database || requireEnv("DB_NAME"),
  dbUser: dbFromUrl?.username || requireEnv("DB_USER"),
  dbPassword: dbFromUrl?.password || requireEnv("DB_PASSWORD"),
  dbSslMode: dbFromUrl?.sslmode || process.env.DB_SSLMODE?.trim() || "",

  jwtAccessSecret: requireEnv("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: requireEnv("JWT_REFRESH_SECRET"),
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES?.trim() || "4h",
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES?.trim() || "7d",

  mailEnabled: toBoolean(process.env.MAIL_ENABLED, false),
  mailHost: process.env.MAIL_HOST?.trim() || "",
  mailPort: toNumber(process.env.MAIL_PORT, 465),
  mailSecure: toBoolean(process.env.MAIL_SECURE, true),
  mailUser: process.env.MAIL_USER?.trim() || "",
  mailPass: process.env.MAIL_PASS?.trim() || "",
  mailFrom: process.env.MAIL_FROM?.trim() || process.env.MAIL_USER?.trim() || "",
  mailFromName: process.env.MAIL_FROM_NAME?.trim() || "Nico Galicia Stylist Men",
  businessPublicName: process.env.BUSINESS_PUBLIC_NAME?.trim() || "Nico Galicia Stylist Men",
  businessWhatsapp: process.env.BUSINESS_WHATSAPP?.trim() || "",
};

export const isProd = env.nodeEnv === "production";
export const isDev = env.nodeEnv === "development";
