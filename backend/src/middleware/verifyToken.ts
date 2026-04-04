import type { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError.js";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "../types/jwt.js";
import { prisma } from "../config/db.js";

export const verifyToken = async (
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      res.clearCookie("jwt", {
        httpOnly: true,
        sameSite: "strict",
      });

      throw new AppError("User no longer exists", 401);
    }

    req.user = decoded;
    next();
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }
};
