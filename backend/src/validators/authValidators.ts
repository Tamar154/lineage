import { z } from "zod";

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6).max(20),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export { registerSchema, loginSchema };
