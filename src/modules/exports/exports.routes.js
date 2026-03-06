import { Router } from "express";
import {
  exportAppointmentsController,
  exportIncomesController,
} from "./exports.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/appointments", exportAppointmentsController);
router.get("/incomes", exportIncomesController);

export default router;