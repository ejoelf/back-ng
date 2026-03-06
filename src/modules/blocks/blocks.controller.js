import { ok } from "../../utils/apiResponse.js";
import {
  listBlocks,
  createBlock,
  deleteBlock,
  copyBlocksFromWeek,
} from "./blocks.service.js";

export async function listBlocksController(req, res, next) {
  try {
    const blocks = await listBlocks();
    return ok(res, { blocks });
  } catch (error) {
    return next(error);
  }
}

export async function createBlockController(req, res, next) {
  try {
    const block = await createBlock(req.body);
    return ok(
      res,
      {
        message: "Bloqueo creado correctamente.",
        block,
      },
      201
    );
  } catch (error) {
    return next(error);
  }
}

export async function deleteBlockController(req, res, next) {
  try {
    await deleteBlock(req.params.id);
    return ok(res, { message: "Bloqueo eliminado correctamente." });
  } catch (error) {
    return next(error);
  }
}

export async function copyBlocksFromWeekController(req, res, next) {
  try {
    const result = await copyBlocksFromWeek(req.body);
    return ok(res, result);
  } catch (error) {
    return next(error);
  }
}