import { Server } from "socket.io";
import { AuthSocket } from "../socket.types";
import { Chat } from "../../modules/chats/chat.model";
import { Message } from "../../modules/messages/message.model";
import { isUserOnline } from "../presence/presence.manage";

export const registerMessageEvents = (io: Server, socket: AuthSocket) => {
  socket.on("message:send", async ({ chatId, text, replyTo }, ack) => {
    try {
      if (!text?.trim()) {
        return ack?.({ ok: false, error: "Empty message" });
      }

      const chat = await Chat.findById(chatId);
      if (!chat) return ack?.({ ok: false, error: "Chat not found" });

      const isMember = chat.members.some((m) => m.toString() === socket.userId);
      if (!isMember) return ack?.({ ok: false, error: "Forbidden" });

      // 🔹 Resolve replyTo safely
      let replyMsg = null;
      if (replyTo) {
        replyMsg = await Message.findOne({
          _id: replyTo,
          chatId,
          isDeletedForEveryone: false,
        }).select("_id");
      }

      // 🔹 Users currently in chat room → delivered (NOT read)
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
        replyTo: replyMsg?._id || null,
        readBy: [socket.userId],
        deliveredTo: Array.from(deliveredTo),
      });

      await Chat.updateOne(
        { _id: chatId },
        {
          $set: {
            lastMessage: msg._id,
            updatedAt: new Date(),
          },
        },
      );

      const populated = await Message.findById(msg._id)
        .populate("senderId", "name username avatar")
        .populate("replyTo", "text senderId createdAt");

      io.to(`chat:${chatId}`).emit("message:new", {
        chatId,
        message: populated,
      });
      for (const member of chat.members) {
        const userId = member.toString();

        io.to(`user:${userId}`).emit("chat:update", {
          chatId,
          lastMessage: populated,
          incrementUnread: userId !== socket.userId,
        });
      }

      ack?.({ ok: true, messageId: msg._id });
    } catch (err) {
      console.error("message:send failed", err);
      ack?.({ ok: false, error: "Internal error" });
    }
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
      { returnDocument: "after" },
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
      { returnDocument: "after" },
    );

    if (!msg) return ack?.({ ok: false });

    io.to(`chat:${msg.chatId}`).emit("message:deleted", {
      messageId,
    });
    // 🔥 ALSO update chat list
    for (const member of msg.chatId?.members) {
      const memberId = member.toString();
      io.to(`user:${memberId}`).emit("chat:update", {
        chatId: msg.chatId,
        lastMessage: {
          text: "This message was deleted",
          type: "system",
        },
      });
    }

    ack?.({ ok: true });
  });
};
