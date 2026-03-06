import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  password: string;
  avatar?: {
    url?: string;
    public_id?: string;
  };
  refreshToken?: string;
  isLocationEnabled: boolean;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  publicKey: string;
  createdAt: Date;
  updatedAt: Date;
  backupKey?: {
    encryptedPrivateKey?: string;
    iv?: string;
    salt?: string;
  };
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
      url: {
        type: String,
        default: "",
        maxlength: [500, "Avatar URL cannot exceed 500 characters"],
      },
      public_id: {
        type: String,
        default: "",
      },
    },

    refreshToken: {
      type: String,
      default: "",
      maxlength: [500, "Refresh token cannot exceed 500 characters"],
    },
    isLocationEnabled: { type: Boolean, default: false },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    publicKey: {
      type: String,
      required: true,
      maxlength: [500, "Public key cannot exceed 500 characters"],
    },
    backupKey: {
      encryptedPrivateKey: { type: String },
      iv: { type: String },
      salt: { type: String },
    },
  },
  { timestamps: true },
);

// 🔥 required for nearby queries
userSchema.index({ location: "2dsphere" });

export const User = mongoose.model<IUser>("User", userSchema);
