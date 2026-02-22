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
router.get("/starred/all", requireAuth, messagesController.listStarred);
router.post("/:id/forward", requireAuth, messagesController.forward);
router.post("/:id/star", requireAuth, messagesController.star);
router.post("/:id/unstar", requireAuth, messagesController.unstar);
router.post("/:id/react", requireAuth, messagesController.react);

export default router;
