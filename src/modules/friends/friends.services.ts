import mongoose from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { FriendRequest } from "./friend-request.model";
import { Friendship } from "./friendship.model";
import { Chat } from "../chats/chat.model";

export const friendsService = {
  areFriend: async (userA: string, userB: string) => {
    const [u1, u2] = [userA, userB].sort();
    const existing = await Friendship.findOne({ user1: u1, user2: u2 });
    return !!existing;
  },

  sendRequest: async (fromUserId: string, toUserId: string) => {
    if (fromUserId === toUserId) {
      throw new ApiError(400, "Cannot add yourself");
    }

    // already friends
    const [u1, u2] = [fromUserId, toUserId].sort();
    const isFriend = await Friendship.findOne({ user1: u1, user2: u2 });
    if (isFriend) {
      throw new ApiError(409, "Already friends");
    }

    // reverse pending
    const reverse = await FriendRequest.findOne({
      fromUser: toUserId,
      toUser: fromUserId,
      status: "pending",
    });
    if (reverse) {
      throw new ApiError(409, "User already sent you a request");
    }

    // same-direction request
    const existing = await FriendRequest.findOne({
      fromUser: fromUserId,
      toUser: toUserId,
    });

    if (existing) {
      if (existing.status === "pending") {
        throw new ApiError(409, "Request already sent");
      }

      // cancelled / rejected → resend
      existing.status = "pending";
      await existing.save();
      return existing;
    }

    // create new
    return FriendRequest.create({
      fromUser: fromUserId,
      toUser: toUserId,
      status: "pending",
    });
  },

  acceptRequest: async (userId: string, requestId: string) => {
    const req = await FriendRequest.findById(requestId);

    if (!req) throw new ApiError(404, "Request not found");
    if (req.toUser.toString() !== userId)
      throw new ApiError(403, "Not allowed");

    if (req.status !== "pending")
      throw new ApiError(400, "Request already processed");

    req.status = "accepted";
    await req.save();

    const [u1, u2] = [req.fromUser.toString(), req.toUser.toString()].sort();

    // create friendship
    let friendship: any = null;

    try {
      friendship = await Friendship.create({ user1: u1, user2: u2 });
    } catch (err: any) {
      if (err.code === 11000) {
        friendship = await Friendship.findOne({ user1: u1, user2: u2 });
      } else {
        throw err;
      }
    }

    // 🔥 auto-create private chat
    const existingChat = await Chat.findOne({
      type: "private",
      friendshipId: friendship._id,
    });

    if (!existingChat) {
      await Chat.create({
        type: "private",
        members: [req.fromUser, req.toUser],
        friendshipId: friendship._id,
        createdBy: req.fromUser,
      });
    }

    return req;
  },

  rejectRequest: async (userId: string, requestId: string) => {
    const req = await FriendRequest.findById(requestId);

    if (!req) throw new ApiError(404, "Request not found");
    if (req.toUser.toString() !== userId)
      throw new ApiError(403, "Not allowed");

    if (req.status !== "pending")
      throw new ApiError(400, "Request already processed");

    req.status = "rejected";
    await req.save();

    return req;
  },
  cancelRequest: async (userId: string, requestId: string) => {
    const req = await FriendRequest.findById(requestId);

    if (!req) throw new ApiError(404, "Request not found");
    if (req.fromUser.toString() !== userId)
      throw new ApiError(403, "Not allowed");

    if (req.status !== "pending")
      throw new ApiError(400, "Request already processed");

    req.status = "cancelled";
    await req.save();

    return req;
  },
  listIncoming: async (userId: string) => {
    return FriendRequest.find({
      toUser: userId,
      status: "pending",
    })
      .populate("fromUser", "name username email avatar")
      .sort({ createdAt: -1 });
  },

  listOutgoing: async (userId: string) => {
    return FriendRequest.find({
      fromUser: userId,
      status: "pending",
    })
      .populate("toUser", "name username email avatar")
      .sort({ createdAt: -1 });
  },
  listFriends: async (userId: string) => {
    const friendships = await Friendship.find({
      $or: [{ user1: userId }, { user2: userId }],
    })
      .populate("user1", "name username email avatar")
      .populate("user2", "name username email avatar")
      .sort({ createdAt: -1 });

    return friendships.map((f) => {
      const u1 = f.user1 as any;
      const u2 = f.user2 as any;

      return u1._id.toString() === userId ? u2 : u1;
    });
  },
};
