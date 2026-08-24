import axios from "axios";

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const isApiErrorResponse = (
  value: unknown,
): value is ApiErrorResponse => {
  if (!isRecord(value) || !isRecord(value.error)) return false;

  return (
    typeof value.error.code === "string" &&
    value.error.code.length > 0 &&
    typeof value.error.message === "string" &&
    value.error.message.length > 0
  );
};

export const getLineAgeApiError = (error: unknown) => {
  if (!axios.isAxiosError(error) || !isApiErrorResponse(error.response?.data)) {
    return undefined;
  }

  return error.response.data.error;
};

export const getLineAgeErrorMessage = (
  error: unknown,
  fallback: string,
): string => getLineAgeApiError(error)?.message ?? fallback;
