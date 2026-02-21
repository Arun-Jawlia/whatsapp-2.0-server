import mongoose, { Schema, Document, Types } from "mongoose";

export type NotificationType =
  | "friend_request"
  | "friend_request_accepted"
  | "new_message"
  | "group_added"
  | "group_removed";

export interface INotification extends Document {
  userId: Types.ObjectId; // receiver
  type: NotificationType;

  title: string;
  body: string;

  data?: Record<string, any>;

  isRead: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    type: {
      type: String,
      enum: [
        "friend_request",
        "friend_request_accepted",
        "new_message",
        "group_added",
        "group_removed",
      ],
      required: true,
    },

    title: { type: String, required: true },
    body: { type: String, required: true },

    data: { type: Object, default: {} },

    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema,
);
