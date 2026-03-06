import { ok } from "../../utils/apiResponse.js";
import {
  listSpecialDays,
  upsertSpecialDay,
  deleteSpecialDay,
  copySpecialDaysFromWeek,
} from "./specialDays.service.js";

export async function listSpecialDaysController(req, res, next) {
  try {
    const specialDays = await listSpecialDays();
    return ok(res, { specialDays });
  } catch (error) {
    return next(error);
  }
}

export async function upsertSpecialDayController(req, res, next) {
  try {
    const specialDay = await upsertSpecialDay(req.body);
    return ok(res, {
      message: "Excepción guardada correctamente.",
      specialDay,
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteSpecialDayController(req, res, next) {
  try {
    await deleteSpecialDay(req.params.dateStr);
    return ok(res, { message: "Excepción eliminada correctamente." });
  } catch (error) {
    return next(error);
  }
}

export async function copySpecialDaysFromWeekController(req, res, next) {
  try {
    const result = await copySpecialDaysFromWeek(req.body);
    return ok(res, result);
  } catch (error) {
    return next(error);
  }
}