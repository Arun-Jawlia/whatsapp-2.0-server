import mongoose, { Schema, Document, Types } from "mongoose";

export type ChatType = "private" | "group" | "ai";
export type GroupPolicy = "whatsapp" | "strict";

export interface IChat extends Document {
  type: ChatType;

  members: Types.ObjectId[];

  // private chat only
  friendshipId?: Types.ObjectId;

  // group chat only
  admins: Types.ObjectId[];
  groupPolicy: GroupPolicy;

  title?: string;
  groupIcon?: string;

  lastMessage?: Types.ObjectId;

  createdBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    type: { type: String, enum: ["private", "group", "ai"], required: true },

    members: [{ type: Schema.Types.ObjectId, ref: "User" }],

    friendshipId: { type: Schema.Types.ObjectId, ref: "Friendship" },

    // group fields
    admins: [{ type: Schema.Types.ObjectId, ref: "User" }],
    groupPolicy: {
      type: String,
      enum: ["whatsapp", "strict"],
      default: "whatsapp",
    },

    title: { type: String, default: "" },
    groupIcon: { type: String, default: "" },

    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// indexes for speed
chatSchema.index({ members: 1 });
chatSchema.index({ friendshipId: 1 });
chatSchema.index({ type: 1 });

export const Chat = mongoose.model<IChat>("Chat", chatSchema);
