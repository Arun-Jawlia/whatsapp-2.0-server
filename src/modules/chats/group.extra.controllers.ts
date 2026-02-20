import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { Chat } from "./chat.model";
import { Friendship } from "../friends/friendship.model";

export const groupExtraController = {
  friendshipStatus: asyncHandler(async (req: AuthRequest, res: Response) => {
    const chatId = req.params.chatId;

    const chat = await Chat.findById(chatId);
    if (!chat) throw new ApiError(404, "Group not found");
    if (chat.type !== "group") throw new ApiError(400, "Not a group");

    const isAdmin = chat.admins.some((a) => a.toString() === req.userId);
    if (!isAdmin) throw new ApiError(403, "Only admins can view this");

    const statuses = [];

    for (const member of chat.members) {
      const memberId = member.toString();
      if (memberId === req.userId) continue;

      const [u1, u2] = [req.userId!, memberId].sort();
      const f = await Friendship.findOne({ user1: u1, user2: u2 });

      statuses.push({
        userId: memberId,
        isFriend: !!f,
      });
    }

    res.json({ statuses });
  }),
};