import { ok } from "../../utils/apiResponse.js";
import {
  getNotifications,
  markAllNotificationsAsRead,
} from "./notifications.service.js";

export async function getNotificationsController(req, res, next) {
  try {
    const notifications = await getNotifications();

    return ok(res, { notifications });
  } catch (error) {
    return next(error);
  }
}

export async function readAllNotificationsController(req, res, next) {
  try {
    await markAllNotificationsAsRead();

    return ok(res, {
      message: "Notificaciones marcadas como leídas.",
    });
  } catch (error) {
    return next(error);
  }
}