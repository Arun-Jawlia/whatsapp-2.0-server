import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes";
import { errorMiddleware } from "./middlewares/error.middleware";
import { env } from "./config/env";

export const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({ message: "Chat API running..." });
});

app.use("/api/v1/auth", authRoutes);

app.use(errorMiddleware);
