import mongoose from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { Chat } from "./chat.model";
import { friendsService } from "../friends/friends.services";
import { Friendship } from "../friends/friendship.model";

export const groupService = {
  // check friend relationship between creator and each member
  ensureAllFriends: async (creatorId: string, memberIds: string[]) => {
    for (const id of memberIds) {
      if (id === creatorId) continue;
      const [u1, u2] = [creatorId, id].sort();
      const f = await Friendship.findOne({ user1: u1, user2: u2 });
      if (!f) throw new ApiError(403, "You can only add friends to a group");
    }
  },

  createGroup: async ({
    creatorId,
    title,
    memberIds,
    groupPolicy,
  }: {
    creatorId: string;
    title: string;
    memberIds: string[];
    groupPolicy: "whatsapp" | "strict";
  }) => {
    // remove duplicates
    const unique = Array.from(new Set([creatorId, ...memberIds]));

    if (unique.length < 2) throw new ApiError(400, "Select at least 1 friend");

    await groupService.ensureAllFriends(creatorId, unique);

    const chat = await Chat.create({
      type: "group",
      title,
      members: unique,
      admins: [creatorId],
      groupPolicy,
      createdBy: creatorId,
    });

    return chat;
  },

  addMembers: async ({
    actorId,
    chatId,
    memberIds,
  }: {
    actorId: string;
    chatId: string;
    memberIds: string[];
  }) => {
    const chat = await Chat.findById(chatId);
    if (!chat) throw new ApiError(404, "Group not found");
    if (chat.type !== "group") throw new ApiError(400, "Not a group");

    const isAdmin = chat.admins.some((a) => a.toString() === actorId);
    if (!isAdmin) throw new ApiError(403, "Only admins can add members");

    // unique and not already members
    const newMembers = memberIds.filter(
      (id) => !chat.members.some((m) => m.toString() === id)
    );

    if (newMembers.length === 0) throw new ApiError(400, "No new members");

    // friends only rule
    await groupService.ensureAllFriends(actorId, newMembers);

    chat.members.push(...(newMembers as any));
    await chat.save();

    return chat;
  },

  removeMember: async ({
    actorId,
    chatId,
    memberId,
  }: {
    actorId: string;
    chatId: string;
    memberId: string;
  }) => {
    const chat = await Chat.findById(chatId);
    if (!chat) throw new ApiError(404, "Group not found");
    if (chat.type !== "group") throw new ApiError(400, "Not a group");

    const isAdmin = chat.admins.some((a) => a.toString() === actorId);
    if (!isAdmin) throw new ApiError(403, "Only admins can remove members");

    // cannot remove self using this route
    if (memberId === actorId) throw new ApiError(400, "Use leave group");

    chat.members = chat.members.filter((m) => m.toString() !== memberId);
    chat.admins = chat.admins.filter((a) => a.toString() !== memberId);

    await chat.save();
    return chat;
  },

  leaveGroup: async ({ userId, chatId }: { userId: string; chatId: string }) => {
    const chat = await Chat.findById(chatId);
    if (!chat) throw new ApiError(404, "Group not found");
    if (chat.type !== "group") throw new ApiError(400, "Not a group");

    const isMember = chat.members.some((m) => m.toString() === userId);
    if (!isMember) throw new ApiError(403, "Not a member");

    chat.members = chat.members.filter((m) => m.toString() !== userId);
    chat.admins = chat.admins.filter((a) => a.toString() !== userId);

    // if no admins left, promote first member
    if (chat.admins.length === 0 && chat.members.length > 0) {
      chat.admins = [chat.members[0]];
    }

    await chat.save();
    return chat;
  },

  updateGroup: async ({
    actorId,
    chatId,
    title,
    groupPolicy,
  }: {
    actorId: string;
    chatId: string;
    title?: string;
    groupPolicy?: "whatsapp" | "strict";
  }) => {
    const chat = await Chat.findById(chatId);
    if (!chat) throw new ApiError(404, "Group not found");
    if (chat.type !== "group") throw new ApiError(400, "Not a group");

    const isAdmin = chat.admins.some((a) => a.toString() === actorId);
    if (!isAdmin) throw new ApiError(403, "Only admins can update group");

    if (title !== undefined) chat.title = title;
    if (groupPolicy !== undefined) chat.groupPolicy = groupPolicy;

    await chat.save();
    return chat;
  },
};