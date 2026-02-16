import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { chatsController } from "./chat.controllers";

const router = Router();

router.get("/", requireAuth, chatsController.listChats);
router.get(
  "/private/:friendId",
  requireAuth,
  chatsController.getPrivateChatByFriendId,
);
router.get("/:chatId/messages", requireAuth, chatsController.listMessages);
router.post("/:chatId/messages", requireAuth, chatsController.sendMessage);

export default router;
