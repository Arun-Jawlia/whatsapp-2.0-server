import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { ensureAiChatForUser } from "./ai.chat";
import { Message } from "../messages/message.model";
import { aiService } from "./ai.services";
import { Chat } from "../chats/chat.model";
import { getIO } from "../../socket/io";

export const aiController = {
  send: asyncHandler(async (req: AuthRequest, res: Response) => {
    const text = req.body?.text;
    const io = getIO();

    if (!text || typeof text !== "string" || !text.trim()) {
      throw new ApiError(400, "Text required");
    }

    const userId = req.userId!;
    const chat = await ensureAiChatForUser(userId);

    // 1) store user message
    const userMsg = await Message.create({
      chatId: chat._id,
      senderId: userId,
      type: "text",
      text: text.trim(),
      readBy: [userId],
      deletedFor: [],
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

    // 4) store AI reply (senderId = null)
    const aiMsg = await Message.create({
      chatId: chat._id,
      senderId: null,
      type: "text",
      text: aiText,
      readBy: [userId],
      deletedFor: [],
    });

    io.to(chat._id.toString()).emit("message:new", {
      chatId: chat._id,
      message: aiMsg,
    });
    // io.to(chat._id.toString()).emit("message:new", {
    //   chatId: chat._id,
    //   message: userMsg,
    // });

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
