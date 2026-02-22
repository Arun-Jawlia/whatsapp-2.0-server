import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { Message } from "./message.model";
import { Chat } from "../chats/chat.model";
import { getIO } from "../../socket/io";

export const messagesController = {
  edit: asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = req.params.id;
    const text = req.body?.text;

    if (!text || typeof text !== "string" || !text.trim()) {
      throw new ApiError(400, "Text required");
    }

    const msg = await Message.findById(id);
    if (!msg) throw new ApiError(404, "Message not found");

    if (msg.senderId?.toString() !== req.userId) {
      throw new ApiError(403, "Not allowed");
    }

    if (msg.isDeletedForEveryone) {
      throw new ApiError(400, "Cannot edit deleted message");
    }

    msg.text = text.trim();
    msg.isEdited = true;
    await msg.save();

    const io = getIO();
    io.to(msg.chatId.toString()).emit("message:edited", {
      chatId: msg.chatId,
      messageId: msg._id,
      text: msg.text,
    });

    res.json({ message: "Edited", msg });
  }),

  deleteForMe: asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = req.params.id;

    const msg = await Message.findById(id);
    if (!msg) throw new ApiError(404, "Message not found");

    // only members can delete for me
    const chat = await Chat.findById(msg.chatId);
    if (!chat) throw new ApiError(404, "Chat not found");

    const isMember = chat.members.some((m) => m.toString() === req.userId);
    if (!isMember) throw new ApiError(403, "Not allowed");

    await Message.updateOne(
      { _id: id },
      { $addToSet: { deletedFor: req.userId } },
    );

    res.json({ message: "Deleted for me" });
  }),

  deleteForEveryone: asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = req.params.id;

    const msg = await Message.findById(id);
    if (!msg) throw new ApiError(404, "Message not found");

    if (msg.senderId?.toString() !== req.userId) {
      throw new ApiError(403, "Not allowed");
    }

    msg.isDeletedForEveryone = true;
    msg.text = "This message was deleted";
    msg.mediaUrl = "";
    msg.mediaMeta = {};
    await msg.save();

    const io = getIO();
    io.to(msg.chatId.toString()).emit("message:deleted", {
      chatId: msg.chatId,
      messageId: msg._id,
    });

    res.json({ message: "Deleted for everyone" });
  }),
  forward: asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = req.params.id;
    const toChatId = req.body?.toChatId;

    if (!toChatId) throw new ApiError(400, "toChatId required");

    const msg = await Message.findById(id);
    if (!msg) throw new ApiError(404, "Message not found");

    const fromChat = await Chat.findById(msg.chatId);
    const toChat = await Chat.findById(toChatId);

    if (!fromChat || !toChat) throw new ApiError(404, "Chat not found");

    const isMemberFrom = fromChat.members.some(
      (m) => m.toString() === req.userId,
    );
    const isMemberTo = toChat.members.some((m) => m.toString() === req.userId);

    if (!isMemberFrom || !isMemberTo) throw new ApiError(403, "Not allowed");

    const newMsg = await Message.create({
      chatId: toChatId,
      senderId: req.userId,
      type: msg.type,
      text: msg.text,
      mediaUrl: msg.mediaUrl,
      mediaMeta: msg.mediaMeta,
      replyTo: null,
      forwardedFrom: msg._id,
      deliveredTo: [],
      readBy: [req.userId],
      deletedFor: [],
      isEdited: false,
      isDeletedForEveryone: false,
    });

    toChat.lastMessage = newMsg._id as any;
    await toChat.save();

    const populated = await Message.findById(newMsg._id).populate(
      "senderId",
      "name username avatar",
    );

    const io = getIO();
    io.to(toChatId).emit("message:new", {
      chatId: toChatId,
      message: populated,
    });

    res.status(201).json({ message: populated });
  }),
  star: asyncHandler(async (req: AuthRequest, res: Response) => {
    await Message.updateOne(
      { _id: req.params.id },
      { $addToSet: { starredBy: req.userId } },
    );
    res.json({ message: "Starred" });
  }),

  unstar: asyncHandler(async (req: AuthRequest, res: Response) => {
    await Message.updateOne(
      { _id: req.params.id },
      { $pull: { starredBy: req.userId } },
    );
    res.json({ message: "Unstarred" });
  }),

  listStarred: asyncHandler(async (req: AuthRequest, res: Response) => {
    const messages = await Message.find({
      starredBy: req.userId,
      deletedFor: { $ne: req.userId },
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("senderId", "name username avatar");

    res.json({ messages });
  }),
  react: asyncHandler(async (req: AuthRequest, res: Response) => {
    const emoji = req.body?.emoji;

    const allowed = ["❤️", "😂", "🔥", "😡", "👍", "😢"];

    if (!allowed.includes(emoji)) throw new ApiError(400, "Invalid emoji");

    const msg = await Message.findById(req.params.id);
    if (!msg) throw new ApiError(404, "Message not found");

    const chat = await Chat.findById(msg.chatId);
    if (!chat) throw new ApiError(404, "Chat not found");

    const isMember = chat.members.some((m) => m.toString() === req.userId);
    if (!isMember) throw new ApiError(403, "Not allowed");

    const current = (msg.reactions?.get(emoji) as any[]) || [];

    const already = current.some((u) => u.toString() === req.userId);

    if (already) {
      // remove
      const updated = current.filter((u) => u.toString() !== req.userId);
      msg.reactions.set(emoji, updated);
    } else {
      msg.reactions.set(emoji, [...current, req.userId as any]);
    }

    await msg.save();

    const io = getIO();
    io.to(msg.chatId.toString()).emit("message:reaction", {
      chatId: msg.chatId,
      messageId: msg._id,
      reactions: Object.fromEntries(msg.reactions),
    });

    res.json({ message: "Reaction updated" });
  }),
};
