import { Router } from "express";
import { authController } from "./auth.controllers";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);

export default router;
