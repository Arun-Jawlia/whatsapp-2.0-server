import mongoose, { Schema, Document, Types } from "mongoose";

export type MessageType =
  | "text"
  | "image"
  | "video"
  | "file"
  | "audio"
  | "system";

export interface IMessage extends Document {
  chatId: Types.ObjectId;
  senderId?: Types.ObjectId; // null for AI/system

  type: MessageType;

  text?: string;

  mediaUrl?: string;
  mediaMeta?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  };

  replyTo?: Types.ObjectId;

  deletedFor: Types.ObjectId[]; // hide for specific users
  readBy: Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User" },

    type: {
      type: String,
      enum: ["text", "image", "video", "file", "audio", "system"],
      default: "text",
    },

    text: { type: String, default: "" },

    mediaUrl: { type: String, default: "" },
    mediaMeta: {
      fileName: String,
      fileSize: Number,
      mimeType: String,
    },

    replyTo: { type: Schema.Types.ObjectId, ref: "Message" },

    deletedFor: [{ type: Schema.Types.ObjectId, ref: "User" }],
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

messageSchema.index({ chatId: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>("Message", messageSchema);
