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
  getAppointmentByCodeController,
  cancelAppointmentByCodeController,
  rescheduleAppointmentByCodeController,
} from "./appointments.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { searchPublicAppointments } from "./appointments.public.controller.js";

const router = Router();

// =========================
// Públicas
// =========================
router.get("/public/availability", getPublicAvailabilityController);
router.post("/appointments/public", createPublicAppointmentController);
router.post("/appointments/search-public", searchPublicAppointments);

// Gestión pública por código
router.get("/appointments/by-code/:code", getAppointmentByCodeController);
router.post("/appointments/cancel-by-code", cancelAppointmentByCodeController);
router.post("/appointments/reschedule-by-code", rescheduleAppointmentByCodeController);

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