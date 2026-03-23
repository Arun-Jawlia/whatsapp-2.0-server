import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  addMembersSchema,
  createGroupSchema,
  removeMemberSchema,
  updateGroupSchema,
} from "./chats.validation";
import { groupService } from "./group.services";

export const groupController = {
  createGroup: asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsed = createGroupSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Invalid group data");

    const chat = await groupService.createGroup({
      creatorId: req.userId!,
      title: parsed.data.title,
      memberIds: parsed.data.memberIds,
      groupPolicy: parsed.data.groupPolicy || "whatsapp",
    });

    res.status(201).json({ message: "Group created", chat });
  }),

  addMembers: asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsed = addMembersSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Invalid data");

    const chat = await groupService.addMembers({
      actorId: req.userId!,
      chatId: parsed.data.chatId,
      memberIds: parsed.data.memberIds,
    });

    res.json({ message: "Members added", chat });
  }),

  removeMember: asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsed = removeMemberSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Invalid data");

    const chat = await groupService.removeMember({
      actorId: req.userId!,
      chatId: parsed.data.chatId,
      memberId: parsed.data.memberId,
    });

    res.json({ message: "Member removed", chat });
  }),

  leaveGroup: asyncHandler(async (req: AuthRequest, res: Response) => {
    const chatId = String(req.params.chatId);

    const chat = await groupService.leaveGroup({
      userId: req.userId!,
      chatId,
    });

    res.json({ message: "Left group", chat });
  }),

  updateGroup: asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsed = updateGroupSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Invalid data");

    const chat = await groupService.updateGroup({
      actorId: req.userId!,
      chatId: parsed.data.chatId,
      title: parsed.data.title,
      groupPolicy: parsed.data.groupPolicy,
    });

    res.json({ message: "Group updated", chat });
  }),
};