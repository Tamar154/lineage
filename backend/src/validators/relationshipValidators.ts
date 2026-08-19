import { z } from "zod";
export const createRelSchema = z.object({
  personAId: z.uuid(),
  personBId: z.uuid(),
  relation: z.enum(["PARENT", "CHILD", "SPOUSE"]),
}).strict();

export const relParamsSchema = z.object({
  relationshipId: z.uuid(),
});

export type CreateRelationshipInput = z.infer<typeof createRelSchema>;
export type RelationshipParams = z.infer<typeof relParamsSchema>;
