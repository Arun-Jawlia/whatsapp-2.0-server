import { z } from "zod";

export const sendRequestSchema = z.object({
  toUserId: z.string().min(1),
});

export const respondRequestSchema = z.object({
  requestId: z.string().min(1),
});

export const cancelRequestSchema = z.object({
  requestId: z.string().min(1),
});
