import { Router } from "express";
import {
  listRecurringBlocksController,
  createRecurringBlockController,
  deleteRecurringBlockController,
  createRecurringBlocksFromWeekController,
} from "./recurringBlocks.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", listRecurringBlocksController);
router.post("/", createRecurringBlockController);
router.delete("/:id", deleteRecurringBlockController);
router.post("/from-week", createRecurringBlocksFromWeekController);

export default router;