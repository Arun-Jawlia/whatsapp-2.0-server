import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes";
import { errorMiddleware } from "./middlewares/error.middleware";
import { env } from "./config/env";
import friendRoutes from "./modules/friends/friends.routes";
import UserRoutes from "./modules/users/user.routes";
import chatsRoutes from "./modules/chats/chat.routes";

export const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({ message: "Chat API running..." });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/friends", friendRoutes);
app.use("/api/v1/users", UserRoutes);
app.use("/api/v1/chats", chatsRoutes);

app.use(errorMiddleware);
