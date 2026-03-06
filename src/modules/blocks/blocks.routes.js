import { Router } from "express";
import {
  listBlocksController,
  createBlockController,
  deleteBlockController,
  copyBlocksFromWeekController,
} from "./blocks.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", listBlocksController);
router.post("/", createBlockController);
router.delete("/:id", deleteBlockController);
router.post("/copy-week", copyBlocksFromWeekController);

export default router;