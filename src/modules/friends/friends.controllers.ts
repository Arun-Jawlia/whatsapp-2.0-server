import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  cancelRequestSchema,
  respondRequestSchema,
  sendRequestSchema,
} from "./friends.validation";
import { friendsService } from "./friends.services";

export const friendsController = {
  sendRequest: asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsed = sendRequestSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Invalid data");

    const request = await friendsService.sendRequest(
      req.userId!,
      parsed.data.toUserId,
    );

    res.status(201).json({ message: "Request sent", request });
  }),

  acceptRequest: asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsed = respondRequestSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Invalid data");

    const request = await friendsService.acceptRequest(
      req.userId!,
      parsed.data.requestId,
    );

    res.json({ message: "Request accepted", request });
  }),

  rejectRequest: asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsed = respondRequestSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Invalid data");

    const request = await friendsService.rejectRequest(
      req.userId!,
      parsed.data.requestId,
    );

    res.json({ message: "Request rejected", request });
  }),

  cancelRequest: asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsed = cancelRequestSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Invalid data");

    const request = await friendsService.cancelRequest(
      req.userId!,
      parsed.data.requestId,
    );

    res.json({ message: "Request cancelled", request });
  }),

  incoming: asyncHandler(async (req: AuthRequest, res: Response) => {
    const requests = await friendsService.listIncoming(req.userId!);
    res.json({ requests });
  }),

  outgoing: asyncHandler(async (req: AuthRequest, res: Response) => {
    const requests = await friendsService.listOutgoing(req.userId!);
    res.json({ requests });
  }),

  friends: asyncHandler(async (req: AuthRequest, res: Response) => {
    const friends = await friendsService.listFriends(req.userId!);
    res.json({ friends });
  }),
};
