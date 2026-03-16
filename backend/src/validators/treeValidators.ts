import { z } from "zod";

export const createTreeSchema = z.object({
  name: z.string().min(1, "Tree name is required"),
});

export const treeParamsSchema = z.object({
  treeId: z.uuid(),
});

export type CreateTreeInput = z.infer<typeof createTreeSchema>;
