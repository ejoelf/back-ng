import { Router } from "express";
import {
  getPublicBusinessController,
  getPublicServicesController,
  getPublicStaffController,
} from "./public.controller.js";

const router = Router();

// ✅ todo público
router.get("/business", getPublicBusinessController);
router.get("/services", getPublicServicesController);
router.get("/staff", getPublicStaffController);

export default router;