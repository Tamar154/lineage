import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import AppError from "../utils/AppError.js";
import { toValidationErrorDetails } from "../errors/validationErrorDetails.js";

/**
 * Middleware to validate request body against a Zod schema. If validation fails, it throws an AppError with the validation errors. If validation succeeds, it replaces req.body with the parsed data and calls next().
 * @param schema - The Zod schema to validate against
 * @return A middleware function that validates the request body
 */
export const validateBody = (schema: ZodType): RequestHandler => {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", {
        details: toValidationErrorDetails(parsed.error),
      });
    }

    req.body = parsed.data;
    next();
  };
};

/**
 * Middleware to validate request params against a Zod schema. If validation fails, it throws an AppError with the validation errors. If validation succeeds, it calls next().
 * @param schema - The Zod schema to validate against
 * @return A middleware function that validates the request params
 */
export const parseParams = (schema: ZodType): RequestHandler => {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.params);

    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", {
        details: toValidationErrorDetails(parsed.error),
      });
    }

    req.params = parsed.data as typeof req.params;
    next();
  };
};
