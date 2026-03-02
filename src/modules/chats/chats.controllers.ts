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
    await ensureAiChatForUser(req.userId!);
    const chats = await Chat.find({ members: req.userId })
      .populate("members", "name username email avatar publicKey")
      .populate({ path: "lastMessage", select: "type text createdAt senderId" })
      .sort({ updatedAt: -1 });


    const chatsWithUnread = [];

    for (const c of chats) {
      const lastRead = (c as any).lastRead?.get(req.userId!) || new Date(0);

      const unreadCount = await Message.countDocuments({
        chatId: c._id,
        createdAt: { $gt: lastRead },
        senderId: { $ne: req.userId },
        deletedFor: { $ne: req.userId },
      });

      chatsWithUnread.push({
        ...c.toObject(),
        unreadCount,
      });
    }

    res.json({ chats: chatsWithUnread });
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

    const query: any = {
      chatId,
      deletedFor: { $ne: req.userId },
    };

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
      .populate("senderId", "name username email avatar publicKey");

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
  searchMessages: asyncHandler(async (req: AuthRequest, res: Response) => {
    const chatId = req.params.chatId;
    const q = String(req.query.q || "").trim();

    if (!q) throw new ApiError(400, "Query required");

    const chat = await Chat.findById(chatId);
    if (!chat) throw new ApiError(404, "Chat not found");

    const isMember = chat.members.some((m) => m.toString() === req.userId);
    if (!isMember) throw new ApiError(403, "Not allowed");

    const results = await Message.find({
      chatId,
      deletedFor: { $ne: req.userId },
      isDeletedForEveryone: false,
      text: { $regex: q, $options: "i" },
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("senderId", "name username avatar");

    res.json({ results });
  }),
  pin: asyncHandler(async (req: AuthRequest, res: Response) => {
    await Chat.updateOne(
      { _id: req.params.chatId, members: req.userId },
      { $addToSet: { pinnedBy: req.userId } },
    );
    res.json({ message: "Pinned" });
  }),

  unpin: asyncHandler(async (req: AuthRequest, res: Response) => {
    await Chat.updateOne(
      { _id: req.params.chatId, members: req.userId },
      { $pull: { pinnedBy: req.userId } },
    );
    res.json({ message: "Unpinned" });
  }),
};
