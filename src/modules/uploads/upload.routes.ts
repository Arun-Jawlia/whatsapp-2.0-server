import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { upload } from "./upload.middleware";
import { uploadController } from "./upload.controllers";

const router = Router();

router.post(
  "/message",
  requireAuth,
  upload.single("file"),
  uploadController.sendMediaMessage
);

export default router;