import { Server } from "socket.io";
import { AuthSocket } from "../socket.types";

export const registerTypingEvents = (io: Server, socket: AuthSocket) => {
  socket.on("typing:start", ({ chatId }) => {
    socket.to(`chat:${chatId}`).emit("typing:start", {
      userId: socket.userId,
    });
  });

  socket.on("typing:stop", ({ chatId }) => {
    socket.to(`chat:${chatId}`).emit("typing:stop", {
      userId: socket.userId,
    });
  });
};
