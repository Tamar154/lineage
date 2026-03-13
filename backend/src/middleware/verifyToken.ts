import type { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError.js";
import jwt from "jsonwebtoken";

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies?.jwt;

  if (!token) {
    throw new AppError("Not Authorized", 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = (decoded as any).id;
    next();
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }
};
