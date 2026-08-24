import type { NextFunction, Request, Response } from "express";
import type { ApiErrorResponse } from "../dtos/apiError.js";
import { errorDefinitions } from "../errors/errorDefinitions.js";
import AppError from "../utils/AppError.js";

const isMalformedJsonError = (error: unknown): boolean =>
  error instanceof SyntaxError &&
  typeof error === "object" &&
  error !== null &&
  "status" in error &&
  error.status === 400 &&
  "type" in error &&
  error.type === "entity.parse.failed";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response<ApiErrorResponse>,
  _next: NextFunction,
): void => {
  const appError =
    err instanceof AppError
      ? err
      : isMalformedJsonError(err)
        ? new AppError("VALIDATION_ERROR", {
            message: "The request body contains malformed JSON.",
          })
        : null;

  if (appError) {
    res.status(appError.statusCode).json({
      error: {
        code: appError.code,
        message: appError.message,
        ...(appError.details !== undefined && { details: appError.details }),
      },
    });
    return;
  }

  console.error(err);
  const definition = errorDefinitions.INTERNAL_ERROR;
  res.status(definition.status).json({
    error: {
      code: "INTERNAL_ERROR",
      message: definition.message,
    },
  });
};
