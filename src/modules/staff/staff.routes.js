import { Router } from "express";
import {
  listStaffController,
  getStaffByIdController,
  createStaffController,
  updateStaffController,
  deleteStaffController,
} from "./staff.controller.js";

const router = Router();

router.get("/", listStaffController);
router.get("/:id", getStaffByIdController);
router.post("/", createStaffController);
router.patch("/:id", updateStaffController);
router.delete("/:id", deleteStaffController);

export default router;