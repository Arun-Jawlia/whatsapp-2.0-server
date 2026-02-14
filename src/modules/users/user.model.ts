import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  password: string;
  avatar?: string;

  refreshToken?: string;

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },

    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlength: [5, "Email must be at least 5 characters long"],
      maxlength: [100, "Email cannot exceed 100 characters"],
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      minlength: [6, "Password must be at least 8 characters long"],
      maxlength: [128, "Password cannot exceed 128 characters"],
    },

    avatar: {
      type: String,
      default: "",
      maxlength: [500, "Avatar URL cannot exceed 500 characters"],
    },

    refreshToken: {
      type: String,
      default: "",
      maxlength: [500, "Refresh token cannot exceed 500 characters"],
    },
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>("User", userSchema);
