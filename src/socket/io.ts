import { Server } from "socket.io";

let io: Server | null = null;

export const setIO = (serverIO: Server) => {
  io = serverIO;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
};