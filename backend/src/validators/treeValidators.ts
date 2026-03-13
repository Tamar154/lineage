import { z } from "zod";

export const createTreeSchema = z.object({
  name: z.string().min(1, "Tree name is required"),
});

export const treeParamsSchema = z.object({
  id: z.uuid(),
});
