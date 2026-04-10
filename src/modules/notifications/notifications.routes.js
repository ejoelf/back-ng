import { Router } from "express";
import {
  getNotificationsController,
  readAllNotificationsController,
} from "./notifications.controller.js";

const router = Router();

router.get("/", getNotificationsController);
router.patch("/read-all", readAllNotificationsController);

export default router;