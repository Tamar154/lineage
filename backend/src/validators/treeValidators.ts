import { z } from "zod";
import {
  normalizeOptionalString,
  normalizeRequiredString,
} from "../utils/normalization.js";

export const createTreeSchema = z.object({
  name: z
    .string()
    .transform(normalizeRequiredString)
    .pipe(z.string().min(1, "Tree name is required").max(100)),
  description: z
    .string()
    .max(500)
    .nullable()
    .optional()
    .transform(normalizeOptionalString),
}).strict();

export const updateTreeSchema = createTreeSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required",
);

export const treeParamsSchema = z.object({
  treeId: z.uuid(),
});

export type CreateTreeInput = z.infer<typeof createTreeSchema>;
export type UpdateTreeInput = z.infer<typeof updateTreeSchema>;
