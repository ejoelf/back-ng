import { Router } from "express";
import { loginController, refreshController } from "./auth.controller.js";

const router = Router();

// ✅ pública
router.post("/login", loginController);

// ✅ nuevo: renueva el access token usando el refresh token
router.post("/refresh", refreshController);

export default router;