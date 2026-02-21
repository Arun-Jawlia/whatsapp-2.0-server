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
};
