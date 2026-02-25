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
    console.log(socket.userId, "socket connect")
    if (!userId) return;

    /* -------- PRESENCE -------- */
    const isFirstConnection = addUserSocket(userId, socket.id);
    socket.join(`user:${userId}`);

    // authoritative snapshot (exclude self)
    socket.emit("presence:sync", {
      userIds: getOnlineUserIds().filter((id) => id !== userId),
    });

    // emit online ONLY if user just came online
    if (isFirstConnection) {
      socket.broadcast.emit("presence:online", { userId });
    }

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
