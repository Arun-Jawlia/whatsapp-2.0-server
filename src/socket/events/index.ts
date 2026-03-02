import { Server } from "socket.io";
import { registerChatEvents } from "./chat.events";
import { registerMessageEvents } from "./message.events";
import { registerTypingEvents } from "./typing.events";
import { registerReactionEvents } from "./reaction.events";
import { AuthSocket } from "../socket.types";
import {
  markActive,
  getPresenceSnapshot,
  addUser,
  removeUser,
} from "../presence/presence.manage";

export const registerSocketEvents = (io: Server) => {
  io.on("connection", async (socket: AuthSocket) => {
    const userId = socket.userId;
    if (!userId) return;

    socket.join(`user:${userId}`);

    socket.on("presence:active", () => {
      const cameBack = markActive(userId);

      if (cameBack) {
        io.emit("presence:online", { userId });
      }
    });

    const firstConnection = addUser(userId, socket.id);

    // Send snapshot to THIS user
    socket.emit("presence:sync", {
      // userIds: getOnlineUsers(),
      users: getPresenceSnapshot(),
    });

    // Notify others ONLY if newly online
    if (firstConnection) {
      socket.broadcast.emit("presence:online", { userId });
    }

    /* -------- REGISTER EVENTS -------- */
    registerChatEvents(io, socket);
    registerMessageEvents(io, socket);
    registerTypingEvents(io, socket);
    registerReactionEvents(io, socket);

    /* -------- DISCONNECT -------- */
    socket.on("disconnect", () => {
      const fullyOffline = removeUser(userId, socket.id);

      if (fullyOffline) {
        socket.broadcast.emit("presence:offline", {
          userId,
          lastSeen: Date.now(),
        });
      }
    });
  });
};
