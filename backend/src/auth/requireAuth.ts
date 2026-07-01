import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.js";
import AppError from "../utils/AppError.js";

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session?.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  req.user = {
    id: session.user.id,
  };

  next();
};
