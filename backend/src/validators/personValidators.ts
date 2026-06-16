import { z } from "zod";

const optionalTextSchema = z.string().min(1).nullish();
const optionalPastDateSchema = z.preprocess(
  (value) => (value === null ? undefined : value),
  z.coerce.date().max(new Date()).optional(),
);

export const createPersonSchema = z.object({
  firstName: z.string().min(1),
  lastName: optionalTextSchema,
  gender: optionalTextSchema,
  birthDate: optionalPastDateSchema,
  deathDate: optionalPastDateSchema,
  birthPlace: optionalTextSchema,
  biography: optionalTextSchema,
});

export const personParamsSchema = z.object({
  id: z.uuid(),
});

export type CreatePersonInput = z.infer<typeof createPersonSchema>;
