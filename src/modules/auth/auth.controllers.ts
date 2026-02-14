import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { registerSchema, loginSchema } from "./auth.validation";
import { authService } from "./auth.services";
import { env } from "../../config/env";

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV,
  sameSite: "lax" as const,
};

export const authController = {
  // Register Controller
  register: asyncHandler(async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const { user, accessToken, refreshToken } = await authService.register(
      parsed.data,
    );

    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);

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
};
