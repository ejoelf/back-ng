import { ok } from "../../utils/apiResponse.js";
import {
  loginUser,
  getCurrentSession,
  updateCredentials,
} from "./auth.service.js";

export async function loginController(req, res, next) {
  try {
    const result = await loginUser({
      username: req.body?.username,
      password: req.body?.password,
    });

    return ok(
      res,
      {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
        business: result.business,
      },
      200
    );
  } catch (error) {
    return next(error);
  }
}

export async function meController(req, res, next) {
  try {
    const result = await getCurrentSession({
      userId: req.auth.userId,
    });

    return ok(
      res,
      {
        user: result.user,
        business: result.business,
      },
      200
    );
  } catch (error) {
    return next(error);
  }
}

export async function updateCredentialsController(req, res, next) {
  try {
    const result = await updateCredentials({
      userId: req.auth.userId,
      username: req.body?.username,
      password: req.body?.password,
    });

    return ok(
      res,
      {
        message: "Credenciales actualizadas correctamente.",
        user: result.user,
      },
      200
    );
  } catch (error) {
    return next(error);
  }
}