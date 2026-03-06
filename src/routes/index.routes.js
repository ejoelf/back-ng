import { Router } from "express";

import authRoutes from "../modules/auth/auth.routes.js";
import publicRoutes from "../modules/public/public.routes.js";
import serviceRoutes from "../modules/services/service.routes.js";
import staffRoutes from "../modules/staff/staff.routes.js";
import appointmentsRoutes from "../modules/appointments/appointments.routes.js";
import incomesRoutes from "../modules/incomes/incomes.routes.js";
import clientsRoutes from "../modules/clients/clients.routes.js";
import blocksRoutes from "../modules/blocks/blocks.routes.js";
import specialDaysRoutes from "../modules/special-days/specialDays.routes.js";
import recurringBlocksRoutes from "../modules/recurring-blocks/recurringBlocks.routes.js";
import exportsRoutes from "../modules/exports/exports.routes.js";
import businessRoutes from "../modules/business/business.routes.js";

import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  meController,
  updateCredentialsController,
} from "../modules/auth/auth.controller.js";

const router = Router();

router.get("/health", (req, res) => {
  return res.status(200).json({
    ok: true,
    message: "Servidor funcionando correctamente.",
  });
});

// Auth
router.use("/auth", authRoutes);

// ✅ mantenemos estas rutas como las espera el frontend
router.get("/me", requireAuth, meController);
router.patch("/account/credentials", requireAuth, updateCredentialsController);

// Público
router.use("/public", publicRoutes);
router.use("/business", businessRoutes);

// Módulos protegidos / internos
router.use("/services", serviceRoutes);
router.use("/staff", staffRoutes);
router.use("/clients", clientsRoutes);

router.use(appointmentsRoutes);
router.use(incomesRoutes);
router.use("/blocks",blocksRoutes);
router.use("/special-days",specialDaysRoutes);
router.use("/recurring-blocks",recurringBlocksRoutes);
router.use("/exports",exportsRoutes);

export default router;