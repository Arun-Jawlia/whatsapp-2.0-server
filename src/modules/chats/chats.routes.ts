import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { chatsController } from "./chats.controllers";
import { groupController } from "./group.controllers";
import { groupExtraController } from "./group.extra.controllers";

const router = Router();

router.get("/", requireAuth, chatsController.listChats);
router.get(
  "/private/:friendId",
  requireAuth,
  chatsController.getPrivateChatByFriendId,
);
router.post("/group/create", requireAuth, groupController.createGroup);
router.post("/group/add", requireAuth, groupController.addMembers);
router.post("/group/remove", requireAuth, groupController.removeMember);
router.post("/group/update", requireAuth, groupController.updateGroup);
router.post("/group/leave/:chatId", requireAuth, groupController.leaveGroup);
router.get(
  "/group/:chatId/friendship-status",
  requireAuth,
  groupExtraController.friendshipStatus,
);
router.post("/:chatId/pin", requireAuth, chatsController.pin);
router.post("/:chatId/unpin", requireAuth, chatsController.unpin);
router.get("/:chatId/messages", requireAuth, chatsController.listMessages);
router.post("/:chatId/messages", requireAuth, chatsController.sendMessage);
router.get("/:chatId/search", requireAuth, chatsController.searchMessages);

export default router;
