import { z } from "zod";

export const userIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const updateCurrentUserSchema = z.object({
  name: z.string().trim().min(1).max(120).nullable().optional(),
});

export type UpdateCurrentUserBody = z.infer<typeof updateCurrentUserSchema>;
