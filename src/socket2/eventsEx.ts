import { Server } from "socket.io";
import { Chat } from "../modules/chats/chat.model";
import { Message } from "../modules/messages/message.model";
import { notificationService } from "../modules/notifications/notification.services";

const onlineUsers = new Map<string, Set<string>>();
// userId -> socketId

export const registerSocketEvents = (io: Server) => {
  io.on("connection", async (socket: any) => {
    const userId = socket.userId as string;
    if (!userId) return;

    /* ---------- ONLINE ---------- */
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }

    // join personal user room (for direct notifications)
    onlineUsers.get(userId)!.add(socket.id);
    socket.join(userId);

    // broadcast presence- user is online or offline
    io.emit("user:online", { userId });
    io.emit("presence:online", { userId });
    socket.emit("presence:sync", {
      userIds: Array.from(onlineUsers.keys()),
    });

    /* ---------- CHAT JOIN / LEAVE ---------- */
    socket.on("chat:join", ({ chatId }: { chatId: string }) =>
      socket.join(chatId),
    );
    socket.on("chat:leave", ({ chatId }: { chatId: string }) =>
      socket.leave(chatId),
    );

    // join all chat rooms of this user
    const chats = await Chat.find({ members: userId }).select("_id");
    chats.forEach((c) => socket.join(c._id.toString()));

    // ----------------------------
    // Typing indicators
    // ----------------------------
    socket.on("typing:start", ({ chatId }: { chatId: string }) => {
      socket.to(chatId).emit("typing:start", { chatId, userId });
    });

    socket.on("typing:stop", ({ chatId }: { chatId: string }) => {
      socket.to(chatId).emit("typing:stop", { chatId, userId });
    });

    // ----------------------------
    // Send message
    // ----------------------------
    socket.on(
      "message:send",
      async ({
        chatId,
        text,
        replyTo,
      }: {
        chatId: string;
        text: string;
        replyTo?: string | null;
      }) => {
        if (!text?.trim()) return;

        const chat = await Chat.findById(chatId);
        if (!chat) return;

        const isMember = chat.members.some((m) => m.toString() === userId);
        if (!isMember) return;
        const deliveredTo: string[] = [];

        const msg = await Message.create({
          chatId,
          senderId: userId,
          type: "text",
          text: text.trim(),
          replyTo: replyTo || null,
          deliveredTo,
          readBy: [userId],
          deletedFor: [],
        });

        chat.lastMessage = msg._id as any;
        await chat.save();

        // ----------------------------
        // Delivery logic
        // ----------------------------

        for (const m of chat.members) {
          const id = m.toString();
          if (id === userId) continue;

          // mark delivered if online
          if (onlineUsers.has(id)) {
            deliveredTo.push(id);
          }
        }

        if (deliveredTo.length) {
          await Message.updateOne(
            { _id: msg._id },
            { $addToSet: { deliveredTo: { $each: deliveredTo } } },
          );
        }

        const populated = await Message.findById(msg._id)
          .populate("senderId", "name username email avatar")
          .populate("replyTo", "text senderId createdAt");

        // emit message to chat room
        io.to(chatId).emit("message:new", {
          chatId,
          message: populated,
        });

        // ----------------------------
        // Notifications (DB-heavy by design)
        // ----------------------------
        for (const m of chat.members) {
          const id = m.toString();
          if (id === userId) continue;

          await notificationService.create({
            userId: id,
            type: "new_message",
            title: "New message",
            body: text.trim().slice(0, 50),
            data: { chatId },
          });
        }
      },
    );

    // ----------------------------
    // Read receipts (per chat)
    // ----------------------------
    socket.on("message:read", async ({ chatId }: { chatId: string }) => {
      // mark messages as read
      await Message.updateMany(
        { chatId, readBy: { $ne: userId } },
        { $addToSet: { readBy: userId } },
      );

      // also ensure deliveredTo is updated
      await Message.updateMany(
        { chatId, deliveredTo: { $ne: userId } },
        { $addToSet: { deliveredTo: userId } },
      );

      await Chat.updateOne(
        { _id: chatId },
        { $set: { [`lastRead.${userId}`]: new Date() } },
      );

      socket.to(chatId).emit("message:read", { chatId, userId });
    });

    // ----------------------------
    // Manual chat join (optional)
    // ----------------------------
    socket.on("chat:join", ({ chatId }: { chatId: string }) => {
      socket.join(chatId);
    });

    /* ---------- EDIT ---------- */
    socket.on(
      "message:edit",
      async ({ messageId, text }: { messageId: string; text: string }) => {
        const msg = await Message.findByIdAndUpdate(
          messageId,
          { text, isEdited: true },
          { new: true },
        );
        if (!msg) return;

        io.to(msg.chatId.toString()).emit("message:edited", {
          messageId,
          text,
        });
      },
    );

    /* ---------- DELETE ---------- */
    socket.on(
      "message:delete",
      async ({ messageId }: { messageId: string }) => {
        const msg = await Message.findById(messageId);
        if (!msg) return;

        io.to(msg.chatId.toString()).emit("message:deleted", { messageId });
      },
    );

    /* ---------- REACTIONS ---------- */
    socket.on(
      "message:react",
      async ({
        messageId,
        reactions,
      }: {
        messageId: string;
        reactions: string;
      }) => {
        const msg = await Message.findById(messageId);
        if (!msg) return;

        io.to(msg.chatId.toString()).emit("message:reaction", {
          messageId,
          reactions,
        });
      },
    );

    // ----------------------------
    // Disconnect
    // ----------------------------
    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(userId);
      if (!sockets) return;

      sockets.delete(userId);
      if (sockets.size === 0) {
        onlineUsers.delete(userId);
        io.emit("user:offline", { userId });
        io.emit("presence:offline", { userId });
      }
    });
  });
};
