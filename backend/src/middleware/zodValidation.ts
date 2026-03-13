import type { RequestHandler } from "express";
import { z } from "zod";
import type { ZodType } from "zod";
import AppError from "../utils/AppError.js";

export const validate = (schema: ZodType): RequestHandler => {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(z.prettifyError(parsed.error), 400);
    }

    req.body = parsed.data;
    next();
  };
};

export const parseParams = (schema: ZodType): RequestHandler => {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.params);

    if (!parsed.success) {
      throw new AppError(z.prettifyError(parsed.error), 400);
    }

    next();
  };
};
