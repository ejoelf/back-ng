import { Router } from "express";
import {
  listServicesController,
  createServiceController,
  updateServiceController,
  deleteServiceController,
} from "./service.controller.js";

const router = Router();

router.get("/", listServicesController);
router.post("/", createServiceController);
router.patch("/:id", updateServiceController);
router.delete("/:id", deleteServiceController);

export default router;