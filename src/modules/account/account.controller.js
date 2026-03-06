import { ok } from "../../utils/apiResponse.js";
import {
  getMe,
  updateCredentials,
} from "./account.service.js";

export async function getMeController(req, res, next) {
  try {
    const authUserId =
      req.auth?.userId ||
      req.user?.userId ||
      req.user?.id ||
      null;

    const user = await getMe({ userId: authUserId });

    return ok(res, { user });
  } catch (error) {
    return next(error);
  }
}

export async function updateCredentialsController(req, res, next) {
  try {
    const authUserId =
      req.auth?.userId ||
      req.user?.userId ||
      req.user?.id ||
      null;

    const { username, password } = req.body;

    const user = await updateCredentials({
      userId: authUserId,
      username,
      password,
    });

    return ok(res, {
      message: "Credenciales actualizadas correctamente.",
      user,
    });
  } catch (error) {
    return next(error);
  }
}