import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { notificationController } from "./notification.controllers";

const router = Router();

router.get("/", requireAuth, notificationController.list);
router.post("/read/:id", requireAuth, notificationController.markRead);
router.post("/read-all", requireAuth, notificationController.markAllRead);

export default router;
