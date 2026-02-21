import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { notificationService } from "./notification.services";

export const notificationController = {
  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const notifications = await notificationService.list(req.userId!);
    res.json({ notifications });
  }),

  markRead: asyncHandler(async (req: AuthRequest, res: Response) => {
    await notificationService.markRead(req.userId!, req.params.id);
    res.json({ message: "Marked read" });
  }),

  markAllRead: asyncHandler(async (req: AuthRequest, res: Response) => {
    await notificationService.markAllRead(req.userId!);
    res.json({ message: "All marked read" });
  }),
};
