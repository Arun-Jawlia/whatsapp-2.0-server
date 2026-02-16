import mongoose, { Schema, Document, Types } from "mongoose";

export interface IFriendship extends Document {
  user1: Types.ObjectId;
  user2: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const friendshipSchema = new Schema<IFriendship>(
  {
    user1: { type: Schema.Types.ObjectId, ref: "User", required: true },
    user2: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// prevent duplicates
friendshipSchema.index({ user1: 1, user2: 1 }, { unique: true });

export const Friendship = mongoose.model<IFriendship>(
  "Friendship",
  friendshipSchema
);
