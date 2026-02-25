import { Server } from "socket.io";
import { AuthSocket } from "../socket.types";
import { Chat } from "../../modules/chats/chat.model";
import { Message } from "../../modules/messages/message.model";
import { isUserOnline } from "../presence/presence.manage";

export const registerMessageEvents = (io: Server, socket: AuthSocket) => {
  socket.on("message:send", async ({ chatId, text, replyTo }, ack) => {
    if (!text?.trim()) {
      return ack?.({ ok: false, error: "Empty message" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) return ack?.({ ok: false, error: "Chat not found" });

    const isMember = chat.members.some((m) => m.toString() === socket.userId);
    if (!isMember) return ack?.({ ok: false, error: "Forbidden" });

    // Users currently in chat room (REAL delivery)
    const socketsInRoom = await io.in(`chat:${chatId}`).fetchSockets();
    const deliveredTo = new Set<string>();

    for (const s of socketsInRoom) {
      if (s.userId && s.userId !== socket.userId) {
        deliveredTo.add(s.userId);
      }
    }

    const msg = await Message.create({
      chatId,
      senderId: socket.userId,
      text: text.trim(),
      type: "text",
      replyTo: replyTo || null,
      readBy: [socket.userId],
      deliveredTo: Array.from(deliveredTo),
    });

    await Chat.updateOne({ _id: chatId }, { $set: { lastMessage: msg._id } });

    io.to(`chat:${chatId}`).emit("message:new", {
      chatId,
      message: msg,
    });

    ack?.({ ok: true, messageId: msg._id });
  });

  /* READ */
  socket.on("message:read", async ({ chatId, messageIds }, ack) => {
    if (!Array.isArray(messageIds) || !messageIds.length) return;

    await Message.updateMany(
      {
        _id: { $in: messageIds },
        readBy: { $ne: socket.userId },
      },
      { $addToSet: { readBy: socket.userId } },
    );

    socket.to(`chat:${chatId}`).emit("message:read", {
      chatId,
      userId: socket.userId,
      messageIds,
    });

    ack?.({ ok: true });
  });

  /* EDIT */
  socket.on("message:edit", async ({ messageId, text }, ack) => {
    if (!text?.trim()) return;

    const msg = await Message.findOneAndUpdate(
      { _id: messageId, senderId: socket.userId },
      {
        $set: {
          text: text.trim(),
          isEdited: true,
          editedAt: new Date(),
        },
      },
      { new: true },
    );

    if (!msg) return ack?.({ ok: false });

    io.to(`chat:${msg.chatId}`).emit("message:edited", {
      messageId,
      text: msg.text,
      editedAt: msg.editedAt,
    });

    ack?.({ ok: true });
  });

  /* DELETE */
  socket.on("message:delete", async ({ messageId }, ack) => {
    const msg = await Message.findOneAndUpdate(
      { _id: messageId, senderId: socket.userId },
      {
        $set: {
          isDeletedForEveryone: true,
          deletedAt: new Date(),
        },
      },
      { new: true },
    );

    if (!msg) return ack?.({ ok: false });

    io.to(`chat:${msg.chatId}`).emit("message:deleted", {
      messageId,
    });

    ack?.({ ok: true });
  });
};
