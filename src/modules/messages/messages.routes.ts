import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { messagesController } from "./messages.controllers";

const router = Router();

router.patch("/:id/edit", requireAuth, messagesController.edit);
router.post("/:id/delete-for-me", requireAuth, messagesController.deleteForMe);
router.post(
  "/:id/delete-for-everyone",
  requireAuth,
  messagesController.deleteForEveryone,
);

export default router;
