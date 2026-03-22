import { z } from "zod";
import { RelationshipType } from "../generated/prisma/index.js";

export const createRelSchema = z.object({
  personAId: z.uuid(),
  personBId: z.uuid(),
  type: z.enum(RelationshipType),
});

export const relParamsSchema = z.object({
  id: z.uuid(),
});

export type CreateRelInput = z.infer<typeof createRelSchema>;
export type RelationshipParams = z.infer<typeof relParamsSchema>;
