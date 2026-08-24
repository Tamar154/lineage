import { describe, expect, it } from "vitest";
import {
  getLineAgeApiError,
  getLineAgeErrorMessage,
  isApiErrorResponse,
} from "./apiError";

const axiosError = (data: unknown): unknown => ({
  isAxiosError: true,
  response: { data },
});

describe("LineAge API error extraction", () => {
  it("extracts a typed LineAge error and its message", () => {
    const error = axiosError({
      error: {
        code: "TREE_NAME_ALREADY_EXISTS",
        message: "You already have a tree with this name.",
        details: { fields: { name: "Choose another name." } },
      },
    });

    expect(getLineAgeApiError(error)).toEqual({
      code: "TREE_NAME_ALREADY_EXISTS",
      message: "You already have a tree with this name.",
      details: { fields: { name: "Choose another name." } },
    });
    expect(getLineAgeErrorMessage(error, "Fallback")).toBe(
      "You already have a tree with this name.",
    );
  });

  it("uses the fallback for non-Axios and malformed responses", () => {
    expect(getLineAgeErrorMessage(new Error("Better Auth error"), "Fallback")).toBe("Fallback");
    expect(getLineAgeErrorMessage(axiosError({ message: "Legacy" }), "Fallback")).toBe("Fallback");
    expect(getLineAgeErrorMessage(axiosError({ error: { code: "NOT_FOUND" } }), "Fallback")).toBe("Fallback");
  });

  it("rejects empty or incorrectly typed error properties", () => {
    expect(isApiErrorResponse({ error: { code: "", message: "Message" } })).toBe(false);
    expect(isApiErrorResponse({ error: { code: "NOT_FOUND", message: 4 } })).toBe(false);
    expect(isApiErrorResponse(null)).toBe(false);
  });
});
