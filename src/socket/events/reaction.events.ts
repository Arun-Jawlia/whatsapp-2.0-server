import { Server } from "socket.io";
import { AuthSocket } from "../socket.types";
import { Message } from "../../modules/messages/message.model";

export const registerReactionEvents = (
  io: Server,
  socket: AuthSocket
) => {
  socket.on("message:react", async ({ messageId, emoji }) => {
    const msg = await Message.findById(messageId);
    if (!msg) return;

    const users = msg.reactions.get(emoji) || [];

    if (!users.includes(socket.userId as any)) {
      users.push(socket.userId as any);
    }

    msg.reactions.set(emoji, users);
    await msg.save();

    io.to(`chat:${msg.chatId}`).emit("message:reaction", {
      messageId,
      emoji,
      userId: socket.userId,
    });
  });
};