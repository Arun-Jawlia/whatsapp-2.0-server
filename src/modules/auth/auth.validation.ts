import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(50),
  username: z.string().min(3).max(30),
  email: z.string().email().min(10).max(100),
  password: z.string().min(6).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

export const changePasswordSchema = z.object({
  oldPassword: z
    .string()
    .trim()
    .min(8, "Old password must be at least 8 characters")
    .max(128, "Old password must be at most 128 characters"),
  newPassword: z
    .string()
    .trim()
    .min(8, "Old password must be at least 8 characters")
    .max(128, "Old password must be at most 128 characters"),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  username: z.string().trim().min(3).max(30).optional(),
});
