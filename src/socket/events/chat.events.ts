import { Server } from "socket.io";
import { AuthSocket } from "../socket.types";
import { Chat } from "../../modules/chats/chat.model";

export const registerChatEvents = (
  io: Server,
  socket: AuthSocket
) => {
  socket.on("chat:join", async ({ chatId }) => {
    const chat = await Chat.findById(chatId);
    if (!chat) return;

    const isMember = chat.members.some(
      (m) => m.toString() === socket.userId
    );
    if (!isMember) return;

    socket.join(`chat:${chatId}`);
  });

  socket.on("chat:leave", ({ chatId }) => {
    socket.leave(`chat:${chatId}`);
  });
};