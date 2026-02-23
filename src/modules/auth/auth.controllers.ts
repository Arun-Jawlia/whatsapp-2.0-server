import bcrypt from "bcrypt";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./../../utils/jwt";
import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from "./auth.validation";
import { authService } from "./auth.services";
import { env } from "../../config/env";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { User } from "../users/user.model";
import { ApiError } from "../../utils/ApiError";
import {
  uploadService,
  deleteFromCloudinary,
} from "../uploads/upload.services";
import { userServices } from "../users/user.service";

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV,
  sameSite: "lax" as const,
};

const accessCookieOptions = {
  ...cookieOptions,
  maxAge: 1000 * 60 * 15, // 15 min
};

const refreshCookieOptions = {
  ...cookieOptions,
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
};

export const authController = {
  // Register Controller
  register: asyncHandler(async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const { user, accessToken, refreshToken } = await authService.register(
      parsed.data,
    );

    res.cookie("accessToken", accessToken, accessCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    res.status(201).json({
      message: "Registered successfully",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  }),

  //   Login Controller
  login: asyncHandler(async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const { user, accessToken, refreshToken } = await authService.login(
      parsed.data,
    );

    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);

    res.json({
      message: "Logged in successfully",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  }),

  // Me
  me: asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.userId).select(
      "-password -refreshToken",
    );
    if (!user) throw new ApiError(404, "User not found");

    res.json({ user });
  }),

  // Logout
  logout: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      const user = await User.findOne({ refreshToken });
      if (user) {
        user.refreshToken = "";
        await user.save();
      }
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.json({ message: "Logged out successfully" });
  }),

  // Refresh
  refresh: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) throw new ApiError(401, "Invalid refresh token");

    let decoded: any;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const user = await User.findById(decoded.userId);
    if (!user) throw new ApiError(401, "User not found");

    // IMPORTANT: refresh token rotation
    if (user.refreshToken !== refreshToken) {
      throw new ApiError(401, "Refresh token reused or invalid");
    }

    const newAccessToken = signAccessToken({ userId: user._id });
    const newRefreshToken = signRefreshToken({ userId: user._id });

    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie("accessToken", newAccessToken, accessCookieOptions);
    res.cookie("refreshToken", newRefreshToken, refreshCookieOptions);

    res.json({ message: "Token refreshed" });
  }),
  uploadAvatar: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    if (!req.file) throw new ApiError(400, "file required");
    const mime = req.file.mimetype;
    if (!mime.startsWith("image/")) {
      throw new ApiError(400, "Please select an image");
    }

    const user = await userServices.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user?.avatar?.public_id) {
      await deleteFromCloudinary(user.avatar.public_id);
    }

    const uploaded = await uploadService.uploadToCloudinary(req.file);

    user.avatar = {
      url: uploaded.url,
      public_id: uploaded.publicId,
    };

    await user.save();

    res.json({ user });
  }),

  //  Change Password
  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const parsed = changePasswordSchema.safeParse(req.body);

    if (!parsed.success) return res.status(400).json(parsed.error);

    const user = await User.findById(req.userId).select("+password");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const isPasswordMatch = await bcrypt.compare(
      req.body.oldPassword,
      user.password,
    );
    if (!isPasswordMatch) throw new ApiError(404, "Wrong old Password");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.newPassword, salt);

    user.password = hashedPassword;

    await user.save();
    return res.status(200).json({
      message: "Password Update successfully",
    });
  }),
  updateProfile: asyncHandler(async (req: Request, res: Response) => {}),
};
