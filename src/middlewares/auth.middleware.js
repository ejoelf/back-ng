import { fail } from "../utils/apiResponse.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return fail(res, "No autorizado. Falta el token de acceso.", 401);
    }

    const payload = verifyAccessToken(token);

    req.auth = {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
    };

    return next();
  } catch (error) {
    return fail(res, "Token inválido o vencido. Iniciá sesión nuevamente.", 401);
  }
}