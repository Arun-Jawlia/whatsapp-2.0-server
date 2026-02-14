import bcrypt from "bcrypt";
import { ApiError } from "../../utils/ApiError";
import { User } from "../users/user.model";
import { signAccessToken, signRefreshToken } from "../../utils/jwt";

export const authService = {
  // Register Sevice
  register: async (payload: {
    name: string;
    username: string;
    email: string;
    password: string;
  }) => {
    const existingEmail = await User.findOne({ email: payload.email });
    if (existingEmail) throw new ApiError(409, "Email already exists");
    const existingUsername = await User.findOne({ username: payload.username });
    if (existingUsername) throw new ApiError(409, "Username already exists");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(payload.password, salt);

    const user = await User.create({
      ...payload,
      password: hashedPassword,
    });
    const accessToken = signAccessToken({ userId: user._id });
    const refreshToken = signRefreshToken({ userId: user._id });

    user.refreshToken = refreshToken;
    await user.save();

    return { user, accessToken, refreshToken };
  },
  // Login Service
  login: async (payload: { email: string; password: string }) => {
    const user = await User.findOne({ email: payload.email });
    if (!user) throw new ApiError(401, "Invalid credentials");

    const ok = await bcrypt.compare(payload.password, user.password);
    if (!ok) throw new ApiError(401, "Invalid credentials");

    const accessToken = signAccessToken({ userId: user._id });
    const refreshToken = signRefreshToken({ userId: user._id });

    user.refreshToken = refreshToken;
    await user.save();

    return { user, accessToken, refreshToken };
  },
};
