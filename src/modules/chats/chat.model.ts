import mongoose, { Schema, Document, Types } from "mongoose";

export type ChatType = "private" | "group" | "ai";
export type GroupPolicy = "whatsapp" | "strict";

export interface IChat extends Document {
  type: ChatType;

  members: Types.ObjectId[];

  cover?: {
    url?: string;
    public_id?: string;
  };

  // private chat only
  friendshipId?: Types.ObjectId;

  // group chat only
  admins: Types.ObjectId[];
  groupPolicy: GroupPolicy;

  title?: string;
  groupIcon?: string;

  lastMessage?: Types.ObjectId;

  createdBy?: Types.ObjectId;

  pinnedBy: Types.ObjectId[];

  // userId -> last read timestamp
  lastRead: Map<string, Date>;

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

    pinnedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],

    title: { type: String, default: "" },
    groupIcon: { type: String, default: "" },

    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },

    lastRead: {
      type: Map,
      of: Date,
      default: () => new Map(),
    },
    cover: {
      url: {
        type: String,
        default: "",
      },
      public_id: {
        type: String,
        default: "",
      },
    },
  },
  { timestamps: true },
);

// indexes for speed
chatSchema.index({ members: 1 });
chatSchema.index({ friendshipId: 1 });
chatSchema.index({ type: 1 });
chatSchema.index({ pinnedBy: 1 });

export const Chat = mongoose.model<IChat>("Chat", chatSchema);
