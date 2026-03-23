import { AuthSocket } from "../socket.types";
import { Server } from "socket.io";
const typingUsers = new Map<string, Set<string>>();

export const registerTypingEvents = (io: Server, socket: AuthSocket) => {
  if (!socket.userId) return;
  const userId = socket.userId;
  
  socket.on("typing:start", ({ chatId }) => {
    if (!chatId) return;
    if (!socket.userId) return;

    let users = typingUsers.get(chatId);
    if (!users) {
      users = new Set();
      typingUsers.set(chatId, users);
    }

    // already typing → ignore
    if (users.has(socket.userId)) return;

    users.add(socket.userId);

    socket.to(`chat:${chatId}`).emit("typing:start", {
      chatId,
      userId: socket.userId,
    });
  });

  socket.on("typing:stop", ({ chatId }) => {
    const users = typingUsers.get(chatId);
    if (!users || !socket.userId || !users.has(socket.userId)) return;
    if (!users || !users.has(socket.userId)) return;

    users.delete(socket.userId);

    if (users.size === 0) {
      typingUsers.delete(chatId);
    }

    socket.to(`chat:${chatId}`).emit("typing:stop", {
      chatId,
      userId: socket.userId,
    });
  });

  // 🚨 auto-stop on disconnect
  socket.on("disconnect", () => {
    for (const [chatId, users] of typingUsers.entries()) {
      if (users.has(userId)) {
        users.delete(userId);

        socket.to(`chat:${chatId}`).emit("typing:stop", {
          chatId,
          userId: socket.userId,
        });

        if (users.size === 0) {
          typingUsers.delete(chatId);
        }
      }
    }
  });
};
