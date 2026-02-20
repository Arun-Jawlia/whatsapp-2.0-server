import { Response } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { Chat } from "./chat.model";
import { Message } from "../messages/message.model";
import { ensureAiChatForUser } from "../ai/ai.chat";

export const chatsController = {
  listChats: asyncHandler(async (req: AuthRequest, res: Response) => {
    const chats = await Chat.find({
      members: req.userId,
    })
      .populate("members", "name username email avatar")
      .populate({
        path: "lastMessage",
        select: "type text createdAt senderId",
      })
      .sort({ updatedAt: -1 });
    await ensureAiChatForUser(req.userId!);
    
    res.json({ chats });
  }),

  listMessages: asyncHandler(async (req: AuthRequest, res: Response) => {
    const chatId = req.params.chatId;

    if (!mongoose.isValidObjectId(chatId)) {
      throw new ApiError(400, "Invalid chatId");
    }

    // check membership
    const chat = await Chat.findById(chatId);
    if (!chat) throw new ApiError(404, "Chat not found");

    const isMember = chat.members.some((m) => m.toString() === req.userId);
    if (!isMember) throw new ApiError(403, "Not allowed");

    const limit = Math.min(Number(req.query.limit || 30), 50);
    const cursor = req.query.cursor as string | undefined;

    const query: any = { chatId };

    // cursor pagination (load older)
    if (cursor && mongoose.isValidObjectId(cursor)) {
      const cursorMsg = await Message.findById(cursor);
      if (cursorMsg) {
        query.createdAt = { $lt: cursorMsg.createdAt };
      }
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("senderId", "name username email avatar");

    res.json({
      messages: messages.reverse(), // show oldest -> newest
      nextCursor: messages.length ? messages[0]._id : null,
    });
  }),

  sendMessage: asyncHandler(async (req: AuthRequest, res: Response) => {
    const chatId = req.params.chatId;
    const { text } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      throw new ApiError(400, "Message text required");
    }

    const chat = await Chat.findById(chatId);
    if (!chat) throw new ApiError(404, "Chat not found");

    const isMember = chat.members.some((m) => m.toString() === req.userId);
    if (!isMember) throw new ApiError(403, "Not allowed");

    const msg = await Message.create({
      chatId,
      senderId: req.userId,
      type: "text",
      text: text.trim(),
      readBy: [req.userId],
      deletedFor: [],
    });

    chat.lastMessage = msg._id as any;
    await chat.save();

    const populated = await Message.findById(msg._id).populate(
      "senderId",
      "name username email avatar",
    );

    res.status(201).json({ message: populated });
  }),
  getPrivateChatByFriendId: asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const friendId = req.params.friendId;

      const chat = await Chat.findOne({
        type: "private",
        members: { $all: [req.userId, friendId] },
      });

      if (!chat) throw new ApiError(404, "Chat not found");

      res.json({ chatId: chat._id });
    },
  ),
};
