import { Server } from "socket.io";
import { registerChatEvents } from "./chat.events";
import { registerMessageEvents } from "./message.events";
import { registerTypingEvents } from "./typing.events";
import { registerReactionEvents } from "./reaction.events";
import { AuthSocket } from "../socket.types";
import {
  addUserSocket,
  removeUserSocket,
  getOnlineUserIds,
} from "../presence/presence.manage";

export const registerSocketEvents = (io: Server) => {
  io.on("connection", async (socket: AuthSocket) => {
    const userId = socket.userId;
    if (!userId) return;

    /* -------- PRESENCE -------- */
    addUserSocket(userId, socket.id);
    socket.join(`user:${userId}`);

    // ✅ authoritative snapshot (only to this socket)
    socket.emit("presence:sync", {
      userIds: getOnlineUserIds(),
    });

    // ✅ incremental update (to others only)
    socket.broadcast.emit("presence:online", { userId });

    /* -------- REGISTER EVENTS -------- */
    registerChatEvents(io, socket);
    registerMessageEvents(io, socket);
    registerTypingEvents(io, socket);
    registerReactionEvents(io, socket);

    /* -------- DISCONNECT -------- */
    socket.on("disconnect", () => {
      const fullyOffline = removeUserSocket(userId, socket.id);

      if (fullyOffline) {
        socket.broadcast.emit("presence:offline", { userId });
      }
    });
  });
};
