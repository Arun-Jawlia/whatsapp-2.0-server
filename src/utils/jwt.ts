import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const signAccessToken = (payload: object) => {
  return jwt.sign(payload, env.ACCESS_TOKEN_SECRET as string, {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
};

export const signRefreshToken = (payload: object) => {
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET as string, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET);
};
