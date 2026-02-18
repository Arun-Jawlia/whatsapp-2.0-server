import dotenv from "dotenv";
dotenv.config();
import { app } from "./app";
import { connectToDB } from "./config/db";
import { env } from "./config/env";
import http from "http";
import { initSocket } from "./socket";

const start = async () => {
  await connectToDB();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.PORT, () =>
    console.log(`🚀 Server running on ${env.PORT}`),
  );
};

start();
