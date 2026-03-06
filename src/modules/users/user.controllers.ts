import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { User } from "./user.model";
import { updateLocationSchema } from "./user.validation";

export const usersController = {
  updateLocation: asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsed = updateLocationSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Invalid location data");

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        isLocationEnabled: true,
        location: {
          type: "Point",
          coordinates: [parsed.data.lng, parsed.data.lat],
        },
      },
      { returnDocument: "after" },
    ).select("-password -refreshToken");

    res.json({ message: "Location updated", user });
  }),

  searchUsers: asyncHandler(async (req: AuthRequest, res: Response) => {
    const query = (req.query.query as string) || "";
    if (!query.trim()) return res.json({ users: [] });

    const users = await User.find({
      _id: { $ne: req.userId },
      $or: [
        { name: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    })
      .select("name username email avatar")
      .limit(20);

    res.json({ users });
  }),

  nearbyUsers: asyncHandler(async (req: AuthRequest, res: Response) => {
    const radius = Number(req.query.radius || 5000);

    const me = await User.findById(req.userId);
    if (!me) throw new ApiError(404, "User not found");

    if (!me.isLocationEnabled) {
      throw new ApiError(400, "Location not enabled");
    }

    const users = await User.find({
      _id: { $ne: req.userId },
      isLocationEnabled: true,
      location: {
        $near: {
          $geometry: me.location,
          $maxDistance: radius,
        },
      },
    })
      .select("name username email avatar")
      .limit(50);

    res.json({ users });
  }),
  saveEncryptedKey: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId; // assuming auth middleware
    const { encryptedPrivateKey, iv, salt } = req.body;

    if (!encryptedPrivateKey || !iv || !salt) {
      return res.status(400).json({ message: "Missing backup data" });
    }

    await User.findByIdAndUpdate(userId, {
      $set: {
        backupKey: {
          encryptedPrivateKey,
          iv,
          salt,
        },
      },
    });

    res.json({ success: true });
  }),
  getEncryptedKey: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    const user = await User.findById(userId).select("backupKey");

    if (!user || !user.backupKey) {
      return res.status(404).json({ message: "No backup found" });
    }

    res.json(user.backupKey);
  }),
  updatePublickey: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    const user = await User.findById(userId).select("publicKey");

    if (!user) {
      return res.status(404).json({ message: "No User found" });
    }

    user.publicKey = req.body.publicKey;
    await user.save();

    res.json(user.publicKey);
  }),
};
