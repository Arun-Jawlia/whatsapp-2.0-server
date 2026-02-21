import { Notification } from "./notification.model";
import { getIO } from "../../socket/io";

export const notificationService = {
  create: async (payload: {
    userId: string;
    type: any;
    title: string;
    body: string;
    data?: any;
  }) => {
    const notif = await Notification.create({
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      isRead: false,
    });

    // emit realtime notification to user room
    const io = getIO();
    io.to(payload.userId).emit("notification:new", { notification: notif });

    return notif;
  },

  list: async (userId: string) => {
    return Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
  },

  markRead: async (userId: string, notificationId: string) => {
    await Notification.updateOne(
      { _id: notificationId, userId },
      { isRead: true },
    );
  },

  markAllRead: async (userId: string) => {
    await Notification.updateMany({ userId }, { isRead: true });
  },
};
