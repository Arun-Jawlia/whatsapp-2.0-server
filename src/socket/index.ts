import { Server } from "socket.io";
import http from "http";
import { socketAuth } from "./middleware/socketAuth";
import { registerSocketEvents } from "./events";
import { setIO } from "./io";

export const initSocket = (server: http.Server) => {
  const io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use(socketAuth);

  registerSocketEvents(io);

  return setIO(io);
};
