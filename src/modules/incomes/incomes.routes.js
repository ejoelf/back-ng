import { Router } from "express";
import {
  getIncomeByAppointmentIdController,
  listIncomesByDateController,
  markIncomePaidController,
  setIncomeStatusController,
  createManualIncomeController,
  listIncomesByRangeController,
  getClientsDebtStatusController,
} from "./incomes.controller.js";

const router = Router();

router.get("/incomes/by-appointment/:appointmentId", getIncomeByAppointmentIdController);
router.get("/incomes/by-date", listIncomesByDateController);
router.get("/incomes/range", listIncomesByRangeController);
router.get("/incomes/client-status", getClientsDebtStatusController);

router.post("/incomes/mark-paid", markIncomePaidController);
router.post("/incomes/manual", createManualIncomeController);

router.patch("/incomes/:id/status", setIncomeStatusController);

export default router;