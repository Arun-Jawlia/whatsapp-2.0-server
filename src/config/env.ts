import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: process.env.PORT || 8001,
  MONGO_URI: process.env.MONGO_URI || "",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",

  ACCESS_TOKEN_SECRET:
    process.env.ACCESS_TOKEN_SECRET || "access_secret_of_whatsapp_2.0",
  REFRESH_TOKEN_SECRET:
    process.env.REFRESH_TOKEN_SECRET || "refresh_secret_of_whatsapp_2.0",

  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  NODE_ENV: process.env.NODE_ENV === "production" ? true : false,
};
