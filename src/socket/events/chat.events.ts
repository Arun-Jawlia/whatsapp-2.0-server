import { Server } from "socket.io";
import { AuthSocket } from "../socket.types";
import { Chat } from "../../modules/chats/chat.model";
import { Message } from "../../modules/messages/message.model";

export const registerChatEvents = (io: Server, socket: AuthSocket) => {
  socket.on("chat:join", async ({ chatId }, ack) => {
    const userId = socket.userId;
    if (!chatId) {
      return ack?.({ ok: false, error: "chatId required" });
    }

    const chat = await Chat.findById(chatId).select("_id members");
    if (!chat) {
      return ack?.({ ok: false, error: "Chat not found" });
    }

    const isMember = chat.members.some((m) => m.toString() === socket.userId);
    if (!isMember) {
      return ack?.({ ok: false, error: "Forbidden" });
    }

    socket.join(`chat:${chatId}`);

    // 🔥 MARK UNDELIVERED MESSAGES AS DELIVERED
    await Message.updateMany(
      {
        chatId,
        senderId: { $ne: userId },
        deliveredTo: { $ne: userId },
      },
      {
        $addToSet: { deliveredTo: userId },
      },
    );

    ack?.({ ok: true, chatId });
  });

  socket.on("chat:leave", async ({ chatId }, ack) => {
    if (!chatId) return;

    socket.leave(`chat:${chatId}`);
    await Chat.findByIdAndUpdate(chatId, {
      $set: { [`lastSeen.${socket.userId}`]: new Date() },
    });
    ack?.({ ok: true });
  });
};
