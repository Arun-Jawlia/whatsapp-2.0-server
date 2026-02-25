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
  senderId?: Types.ObjectId | null;
  type: MessageType;
  
  text?: string;
  
  mediaUrl?: string;
  mediaMeta?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  };
  
  replyTo?: Types.ObjectId;
  
  // per-user deletes (delete for me)
  deletedFor: Types.ObjectId[];
  
  // per-user delivery/read
  deliveredTo: Types.ObjectId[];
  readBy: Types.ObjectId[];
  
  // edit
  isEdited: boolean;
  
  // delete for everyone
  isDeletedForEveryone: boolean;
  
  reactions: Map<string, Types.ObjectId[]>;
  
  starredBy: Types.ObjectId[];
  forwardedFrom?: Types.ObjectId;
  
  editedAt?:Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", default: null },

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

    deliveredTo: [{ type: Schema.Types.ObjectId, ref: "User" }],
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],

    isEdited: { type: Boolean, default: false },
    isDeletedForEveryone: { type: Boolean, default: false },
    forwardedFrom: { type: Schema.Types.ObjectId, ref: "Message" },

    reactions: {
      type: Map,
      of: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: () => new Map(),
    },

    starredBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    editedAt: {
      type: Date,
    }
  },
  { timestamps: true },
);

messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ starredBy: 1 });
messageSchema.index({ chatId: 1, text: "text" }); // for search

export const Message = mongoose.model<IMessage>("Message", messageSchema);
