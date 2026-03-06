import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import {
  getBusinessController,
  updateBusinessController,
} from "./business.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", getBusinessController);
router.patch("/", updateBusinessController);

export default router;