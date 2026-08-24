export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue | undefined };

export type ValidationErrorDetails = {
  fields?: Record<string, string>;
  formErrors?: string[];
};

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: JsonValue;
  };
};
