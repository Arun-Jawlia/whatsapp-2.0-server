import { z } from "zod";

export const createGroupSchema = z.object({
  title: z.string().min(2).max(50),
  memberIds: z.array(z.string().min(1)).min(1), // creator + at least 1
  groupPolicy: z.enum(["whatsapp", "strict"]).optional(),
});

export const addMembersSchema = z.object({
  chatId: z.string().min(1),
  memberIds: z.array(z.string().min(1)).min(1),
});

export const removeMemberSchema = z.object({
  chatId: z.string().min(1),
  memberId: z.string().min(1),
});

export const updateGroupSchema = z.object({
  chatId: z.string().min(1),
  title: z.string().min(2).max(50).optional(),
  groupPolicy: z.enum(["whatsapp", "strict"]).optional(),
});