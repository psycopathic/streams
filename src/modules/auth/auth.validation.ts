import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(120).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
export type RefreshBody = z.infer<typeof refreshSchema>;
