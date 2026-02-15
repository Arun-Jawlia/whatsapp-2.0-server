import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyAccessToken } from "../utils/jwt";

export interface AuthRequest extends Request {
  userId?: string;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.accessToken;

  if (!token) throw new ApiError(401, "Not authenticated");

  try {
    const decoded = verifyAccessToken(token) as any;
    req.userId = decoded.userId;
    next();
  } catch (err) {
    throw new ApiError(401, "Access token expired");
  }
};
