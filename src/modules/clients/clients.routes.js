import { Router } from "express";
import {
  createClientController,
  deleteClientController,
  getClientsController,
  updateClientController,
} from "./clients.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", getClientsController);
router.post("/", createClientController);
router.patch("/:clientId", updateClientController);
router.delete("/:clientId", deleteClientController);

export default router;