import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { Chat } from "../chats/chat.model";
import { Message } from "../messages/message.model";
import { uploadService } from "./upload.services";
import { getIO } from "../../socket/io";

export const uploadController = {
  sendMediaMessage: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const chatId = req.body?.chatId;
    const caption = req.body?.caption || "";

    if (!chatId) throw new ApiError(400, "chatId required");
    if (!req.file) throw new ApiError(400, "file required");

    const chat = await Chat.findById(chatId);
    if (!chat) throw new ApiError(404, "Chat not found");

    const isMember = chat.members.some((m) => m.toString() === userId);
    if (!isMember) throw new ApiError(403, "Not allowed");

    // AI chat should not allow file upload (optional rule)
    if (chat.type === "ai") throw new ApiError(400, "AI chat does not support media");

    const uploaded = await uploadService.uploadToCloudinary(req.file);

    const mime = req.file.mimetype;

    let type: any = "file";
    if (mime.startsWith("image/")) type = "image";
    else if (mime.startsWith("video/")) type = "video";
    else if (mime.startsWith("audio/")) type = "audio";

    const msg = await Message.create({
      chatId,
      senderId: userId,
      type,
      text: caption.trim(),
      mediaUrl: uploaded.url,
      mediaMeta: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        id: uploaded.publicId,
      },
      deliveredTo: [],
      readBy: [userId],
      deletedFor: [],
      isEdited: false,
      isDeletedForEveryone: false,
    });

    chat.lastMessage = msg._id as any;
    await chat.save();

    const populated = await Message.findById(msg._id)
      .populate("senderId", "name username email avatar")
      .populate("replyTo", "text senderId createdAt");

    // emit realtime
    const io = getIO();
    io.to(`chat:${chatId}`).emit("message:new", { chatId, message: populated });

    res.status(201).json({ message: populated });
  }),
};