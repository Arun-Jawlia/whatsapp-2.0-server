import { Router } from "express";
import { authController } from "./auth.controllers";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", requireAuth, authController.me);
router.post("/logout", authController.logout);
router.post("/refresh", authController.refresh);

export default router;
