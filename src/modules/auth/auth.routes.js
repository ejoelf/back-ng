import { Router } from "express";
import { loginController } from "./auth.controller.js";

const router = Router();

// ✅ pública
router.post("/login", loginController);

export default router;