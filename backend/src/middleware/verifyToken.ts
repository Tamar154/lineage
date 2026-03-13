import type { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError.js";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "../types/jwt.js";

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }
};
