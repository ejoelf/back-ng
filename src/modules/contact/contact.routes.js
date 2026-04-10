import { Router } from "express";
import { createContact } from "./contact.controller.js";

const router = Router();

router.post("/", createContact);

export default router;