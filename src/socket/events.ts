import { Server } from "socket.io";
import { Chat } from "../modules/chats/chat.model";
import { text } from "node:stream/consumers";
import { Message } from "../modules/messages/message.model";

const onlineUsers = new Map<string, string>();
// userId ==> socketId

export const registerSocketEvents = (io: Server) => {
  io.on("connection", async (socket: any) => {
    const userId = socket.userId as string;

    onlineUsers.set(userId, socket.id);

    // broadcast presence
    io.emit("presence:online", { userId });

    // join all the chat rooms of this user
    const chats = await Chat.find({ members: userId }).select("_id");
    chats.forEach((c) => socket.join(c._id.toString()));

    // Typing
    socket.on("typing:start", ({ chatId }: { chatId: string }) => {
      socket.to(chatId).emit("typing:start", { chatId, userId });
    });

    socket.on("typing:stop", ({ chatId }: { chatId: string }) => {
      socket.to(chatId).emit("typing:stop", { chatId, userId });
    });

    // Send Message RealTime

    socket.on(
      "message:send",
      async ({ chatId, text }: { chatId: string; text: string }) => {
        if (!text?.trim()) return;

        // membership check
        const chat = await Chat.findById(chatId);
        if (!chat) return;

        const isMember = chat.members.some((m) => m.toString() === userId);
        if (!isMember) return;

        const msg = await Message.create({
          chatId,
          senderId: userId,
          type: "text",
          text: text.trim(),
          readBy: [userId],
          deletedFor: [],
        });
        chat.lastMessage = msg._id as any;
        await chat.save();

        const populated = await Message.findById(msg._id).populate(
          "senderId",
          "name username email avatar",
        );

        // emit to chat room
        io.to(chatId).emit("message:new", { chatId, message: populated });
      },
    );
    // ----------------------------
    // Read receipts
    // ----------------------------
    socket.on("message:read", async ({ chatId }: { chatId: string }) => {
      // mark all unread as read by this user
      await Message.updateMany(
        { chatId, readBy: { $ne: userId } },
        { $addToSet: { readBy: userId } },
      );

      socket.to(chatId).emit("message:read", { chatId, userId });
    });

    socket.on("chat:join", ({ chatId }) => {
      socket.join(chatId);
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      io.emit("presence:offline", { userId });
    });
  });
};
