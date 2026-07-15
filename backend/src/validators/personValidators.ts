import { z } from "zod";
import { DatePrecision, Gender } from "../generated/prisma/index.js";
import {
  isDeathConclusivelyBeforeBirth,
  isPartialDateInFuture,
  isValidPartialDate,
} from "../utils/partialDate.js";
import {
  normalizeOptionalString,
  normalizeRequiredString,
} from "../utils/normalization.js";

const optionalString = (max: number) =>
  z.string().max(max).nullable().optional().transform(normalizeOptionalString);

const personFields = {
  firstName: z
    .string()
    .transform(normalizeRequiredString)
    .pipe(z.string().min(1, "First name is required").max(100)),
  lastName: optionalString(100),
  gender: z.enum(Gender).optional(),
  birthDate: z.string().nullable().optional(),
  birthDatePrecision: z.enum(DatePrecision).nullable().optional(),
  deathDate: z.string().nullable().optional(),
  deathDatePrecision: z.enum(DatePrecision).nullable().optional(),
  birthPlace: optionalString(150),
  biography: optionalString(2000),
};

type DateFields = {
  birthDate?: string | null | undefined;
  birthDatePrecision?: DatePrecision | null | undefined;
  deathDate?: string | null | undefined;
  deathDatePrecision?: DatePrecision | null | undefined;
};

export function validatePersonDates(value: DateFields): string[] {
  const errors: string[] = [];
  const pairs = [
    ["birth", value.birthDate, value.birthDatePrecision],
    ["death", value.deathDate, value.deathDatePrecision],
  ] as const;

  for (const [label, date, precision] of pairs) {
    if ((date == null) !== (precision == null)) {
      errors.push(`${label} date and precision must be provided together`);
      continue;
    }
    if (date && precision) {
      const partialDate = { value: date, precision };
      if (!isValidPartialDate(partialDate)) {
        errors.push(`${label} date does not match its precision or calendar`);
      } else if (isPartialDateInFuture(partialDate)) {
        errors.push(`${label} date cannot be in the future`);
      }
    }
  }

  if (
    value.birthDate &&
    value.birthDatePrecision &&
    value.deathDate &&
    value.deathDatePrecision &&
    isDeathConclusivelyBeforeBirth(
      { value: value.birthDate, precision: value.birthDatePrecision },
      { value: value.deathDate, precision: value.deathDatePrecision },
    )
  ) {
    errors.push("Death date cannot be before birth date");
  }

  return errors;
}

const addDateIssues = (value: DateFields, context: z.RefinementCtx) => {
  for (const message of validatePersonDates(value)) {
    context.addIssue({ code: "custom", message });
  }
};

export const createPersonSchema = z
  .object(personFields)
  .strict()
  .superRefine(addDateIssues);

export const updatePersonSchema = z
  .object(personFields)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const personParamsSchema = z.object({
  id: z.uuid(),
});

export type CreatePersonInput = z.infer<typeof createPersonSchema>;
export type UpdatePersonInput = z.infer<typeof updatePersonSchema>;
