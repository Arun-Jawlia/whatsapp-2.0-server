import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { ensureAiChatForUser } from "./ai.chat";
import { Message } from "../messages/message.model";
import { aiGroqService as aiService } from "./ai.services";
import { getIO } from "../../socket/io";

export const aiController = {
  send: asyncHandler(async (req: AuthRequest, res: Response) => {
    const text = req.body?.text;
    const io = getIO();

    if (!req.userId) {
      throw new ApiError(400, "Unauthorized");
    }

    if (!text || typeof text !== "string" || !text.trim()) {
      throw new ApiError(400, "Text required");
    }

    const userId = req.userId!;
    const chat = await ensureAiChatForUser(userId);
    const userMsgDoc = await Message.create({
      chatId: chat._id,
      senderId: userId,
      type: "text",
      text: text.trim(),
      readBy: [userId],
      deletedFor: [],
    });

    const userMsg = userMsgDoc.toObject();

    io.to(`chat:${userMsg.chatId}`).emit("message:new", {
      chatId: chat._id,
      message: userMsg,
    });

    chat.lastMessage = userMsg._id as any;
    await chat.save();

    // 2) load last N messages for memory
    const history = await Message.find({ chatId: chat._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("senderId", "_id");

    // reverse to chronological
    const ordered = history.reverse();

    const promptMessages = [
      {
        role: "system" as const,
        content:
          "You are a helpful AI assistant inside a chat application. Be concise, friendly, and practical.",
      },
      ...ordered.map((m) => {
        const isUser =
          m.senderId && (m.senderId as any)._id?.toString() === userId;

        return {
          role: isUser ? ("user" as const) : ("assistant" as const),
          content: m.text || "",
        };
      }),
    ];

    // 3) call AI
    const aiText = await aiService.generate(promptMessages);
    const finalText = aiText.trim() || "Sorry, I couldn't generate a response.";
    // 4) store AI reply (senderId = null)
    const aiMsgDoc = await Message.create({
      chatId: chat._id,
      senderId: null,
      type: "text",
      text: finalText,
      readBy: [userId],
      deletedFor: [],
    });
    const aiMsg = aiMsgDoc.toObject();

    io.to(`chat:${aiMsg.chatId}`).emit("message:new", {
      chatId: chat._id,
      message: aiMsg,
    });

    chat.lastMessage = aiMsg._id as any;
    await chat.save();

    // return both messages
    res.status(201).json({
      chatId: chat._id,
      userMessage: userMsg,
      aiMessage: aiMsg,
    });
  }),
};
