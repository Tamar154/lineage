import type { JsonValue } from "../dtos/apiError.js";
import {
  errorDefinitions,
  type ErrorCode,
} from "../errors/errorDefinitions.js";

type AppErrorOptions = {
  message?: string;
  details?: JsonValue;
};

class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details: JsonValue | undefined;

  constructor(code: ErrorCode, options: AppErrorOptions = {}) {
    const definition = errorDefinitions[code];
    super(options.message ?? definition.message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = definition.status;
    this.details = options.details;
  }
}

export default AppError;
