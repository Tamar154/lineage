import { z } from "zod";

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6).max(20),
  name: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
