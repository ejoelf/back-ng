export function ok(res, data = {}, status = 200) {
  return res.status(status).json({
    ok: true,
    ...data,
  });
}

export function fail(res, message = "Ocurrió un error.", status = 400, extra = {}) {
  return res.status(status).json({
    ok: false,
    error: {
      message,
      ...extra,
    },
  });
}