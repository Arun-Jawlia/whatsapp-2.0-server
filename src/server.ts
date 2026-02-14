import dotenv from "dotenv";
dotenv.config();
import { app } from "./app";
import { connectToDB } from "./config/db";
import { env } from "./config/env";

const start = async () => {
  await connectToDB();
  app.listen(env.PORT, () => console.log(`🚀 Server running on ${env.PORT}`));
};

start();
