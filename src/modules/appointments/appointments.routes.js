import { Router } from "express";
import {
  getPublicAvailabilityController,
  getAppointmentsAvailableController,
  listAppointmentsByDateController,
  listAppointmentsController,
  createPublicAppointmentController,
  createManualAppointmentController,
  updateAppointmentStatusController,
  cancelAppointmentController,
  rescheduleAppointmentController,
} from "./appointments.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

// =========================
// Públicas
// =========================
router.get("/public/availability", getPublicAvailabilityController);
router.post("/appointments/public", createPublicAppointmentController);

// =========================
// Privadas
// =========================
router.get("/appointments", requireAuth, listAppointmentsController);
router.get("/appointments/available", requireAuth, getAppointmentsAvailableController);
router.get("/appointments/by-date", requireAuth, listAppointmentsByDateController);
router.post("/appointments", requireAuth, createManualAppointmentController);
router.patch("/appointments/:id/status", requireAuth, updateAppointmentStatusController);
router.post("/appointments/:id/cancel", requireAuth, cancelAppointmentController);
router.post("/appointments/:id/reschedule", requireAuth, rescheduleAppointmentController);

export default router;