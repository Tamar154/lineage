import type { ZodError } from "zod";
import type { ValidationErrorDetails } from "../dtos/apiError.js";

export const toValidationErrorDetails = (
  error: ZodError,
): ValidationErrorDetails => {
  const fields: Record<string, string> = {};
  const formErrors: string[] = [];

  for (const issue of error.issues) {
    const message = issue.message.trim();
    if (!message) continue;

    if (issue.path.length === 0) {
      formErrors.push(message);
      continue;
    }

    const field = issue.path.map(String).join(".");
    if (!(field in fields)) fields[field] = message;
  }

  return {
    ...(Object.keys(fields).length > 0 && { fields }),
    ...(formErrors.length > 0 && { formErrors }),
  };
};
