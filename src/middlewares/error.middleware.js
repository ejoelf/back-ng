import { isDev } from "../config/env.js";

export function notFoundMiddleware(req, res) {
  return res.status(404).json({
    ok: false,
    error: {
      message: "Ruta no encontrada.",
    },
  });
}

export function errorMiddleware(err, req, res, next) {
  console.error("❌ Error:", err);

  if (res.headersSent) {
    return next(err);
  }

  const status =
    err.statusCode ||
    err.status ||
    (err.name === "SequelizeValidationError" ? 400 : 500);

  const message =
    err.message ||
    "Ocurrió un error interno en el servidor.";

  const payload = {
    ok: false,
    error: {
      message,
    },
  };

  if (err.code) {
    payload.error.code = err.code;
  }

  if (err.name === "SequelizeValidationError" && Array.isArray(err.errors)) {
    payload.error.details = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  if (isDev) {
    payload.error.stack = err.stack;
  }

  return res.status(status).json(payload);
}