import cookie from "cookie";
import { verifyAccessToken } from "../../utils/jwt";

export const socketAuth = (socket: any, next: (err?: any) => void) => {
  try {
    const rawCookie = socket.handshake.headers.cookie || "";
    const parsed = cookie.parse(rawCookie);

    const token = parsed.accessToken;
    if (!token) return next(new Error("Not authenticated"));

    const decoded = verifyAccessToken(token) as any;
    socket.userId = decoded.userId;

    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
};
