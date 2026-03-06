import { Router } from "express";
import {
  getMeController,
  updateCredentialsController,
} from "./account.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/me", getMeController);
router.patch("/account/credentials", updateCredentialsController);

export default router;