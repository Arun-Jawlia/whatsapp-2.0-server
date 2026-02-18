import { Server } from "socket.io";
import http from "http";
import { env } from "../config/env";
import { socketAuth } from "./auth";
import { registerSocketEvents } from "./events";

export const initSocket = (server: http.Server) => {
  const io = new Server(server, {
    cors: {
      origin:true,
      credentials: true,
    },
  });

  io.use(socketAuth);

  registerSocketEvents(io);

  console.log("✅ Socket.IO initialized");

  return io;
};
