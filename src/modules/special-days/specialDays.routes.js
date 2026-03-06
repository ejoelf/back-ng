import { Router } from "express";
import {
  listSpecialDaysController,
  upsertSpecialDayController,
  deleteSpecialDayController,
  copySpecialDaysFromWeekController,
} from "./specialDays.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", listSpecialDaysController);
router.post("/", upsertSpecialDayController);
router.delete("/:dateStr", deleteSpecialDayController);
router.post("/copy-week", copySpecialDaysFromWeekController);

export default router;