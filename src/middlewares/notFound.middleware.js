export function notFoundMiddleware(req, res) {
  return res.status(404).json({
    ok: false,
    error: {
      message: "Ruta no encontrada.",
    },
  });
}