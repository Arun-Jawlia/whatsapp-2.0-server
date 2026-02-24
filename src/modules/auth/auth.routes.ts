import { Router } from "express";
import { authController } from "./auth.controllers";
import { requireAuth } from "../../middlewares/auth.middleware";
import { upload } from "../uploads/upload.middleware";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", requireAuth, authController.me);
router.post("/logout", authController.logout);
router.post("/refresh", authController.refresh);
router.post(
  "/avatar",
  requireAuth,
  upload.single("file"),
  authController.uploadAvatar,
);
router.put("/change-password", requireAuth, authController.changePassword);
router.post("/update-profile", requireAuth, authController.updateProfile);

export default router;
