import { z } from "zod";

export const createPersonSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthDate: z.coerce.date().max(new Date()).optional(),
  deathDate: z.coerce.date().max(new Date()).optional(),
  bio: z.string().optional(),
});

export const personParamsSchema = z.object({
  id: z.uuid(),
});

export type CreatePersonInput = z.infer<typeof createPersonSchema>;
