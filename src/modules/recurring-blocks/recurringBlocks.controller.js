import { ok } from "../../utils/apiResponse.js";
import {
  listRecurringBlocks,
  createRecurringBlock,
  deleteRecurringBlock,
  createRecurringBlocksFromWeek,
} from "./recurringBlocks.service.js";

export async function listRecurringBlocksController(req, res, next) {
  try {
    const recurringBlocks = await listRecurringBlocks();
    return ok(res, { recurringBlocks });
  } catch (error) {
    return next(error);
  }
}

export async function createRecurringBlockController(req, res, next) {
  try {
    const recurringBlock = await createRecurringBlock(req.body);
    return ok(
      res,
      {
        message: "Bloqueo recurrente creado correctamente.",
        recurringBlock,
      },
      201
    );
  } catch (error) {
    return next(error);
  }
}

export async function deleteRecurringBlockController(req, res, next) {
  try {
    await deleteRecurringBlock(req.params.id);
    return ok(res, { message: "Bloqueo recurrente eliminado correctamente." });
  } catch (error) {
    return next(error);
  }
}

export async function createRecurringBlocksFromWeekController(req, res, next) {
  try {
    const result = await createRecurringBlocksFromWeek(req.body);
    return ok(res, result);
  } catch (error) {
    return next(error);
  }
}