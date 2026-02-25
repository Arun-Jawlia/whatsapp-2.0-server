import { Server } from "socket.io";
import { AuthSocket } from "../socket.types";
import { Chat } from "../../modules/chats/chat.model";
import { Message } from "../../modules/messages/message.model";
import { isUserOnline } from "../presence/presence.manage";

export const registerMessageEvents = (
  io: Server,
  socket: AuthSocket
) => {
  socket.on("message:send", async ({ chatId, text, replyTo }) => {
    if (!text?.trim()) return;

    const chat = await Chat.findById(chatId);
    if (!chat) return;

    const isMember = chat.members.some(
      (m) => m.toString() === socket.userId
    );
    if (!isMember) return;

    const msg = await Message.create({
      chatId,
      senderId: socket.userId,
      text: text.trim(),
      type: "text",
      replyTo: replyTo || null,
      readBy: [socket.userId],
      deliveredTo: [],
    });

    chat.lastMessage = msg._id as any;
    await chat.save();

    // Delivery logic
    const delivered: string[] = [];
    for (const m of chat.members) {
      const id = m.toString();
      if (id === socket.userId) continue;
      if (isUserOnline(id)) delivered.push(id);
    }

    if (delivered.length) {
      await Message.updateOne(
        { _id: msg._id },
        { $addToSet: { deliveredTo: { $each: delivered } } }
      );
    }

    io.to(`chat:${chatId}`).emit("message:new", {
      chatId,
      message: msg,
    });
  });

  /* READ */
  socket.on("message:read", async ({ chatId }) => {
    await Message.updateMany(
      { chatId, readBy: { $ne: socket.userId } },
      { $addToSet: { readBy: socket.userId } }
    );

    await Chat.updateOne(
      { _id: chatId },
      { $set: { [`lastRead.${socket.userId}`]: new Date() } }
    );

    socket.to(`chat:${chatId}`).emit("message:read", {
      chatId,
      userId: socket.userId,
    });
  });

  /* EDIT */
  socket.on("message:edit", async ({ messageId, text }) => {
    const msg = await Message.findById(messageId);
    if (!msg) return;
    if (msg.senderId?.toString() !== socket.userId) return;

    msg.text = text;
    msg.isEdited = true;
    await msg.save();

    io.to(`chat:${msg.chatId}`).emit("message:edited", {
      messageId,
      text,
    });
  });

  /* DELETE */
  socket.on("message:delete", async ({ messageId }) => {
    const msg = await Message.findById(messageId);
    if (!msg) return;
    if (msg.senderId?.toString() !== socket.userId) return;

    msg.isDeletedForEveryone = true;
    await msg.save();

    io.to(`chat:${msg.chatId}`).emit("message:deleted", {
      messageId,
    });
  });
};