import jwt from "jsonwebtoken";
import { type Response } from "express";
import type { User } from "../generated/prisma/client.js";
import type { JwtPayload } from "../types/jwt.js";

/**
 * Generates a JWT token for the given user and sets it as a cookie in the response.
 * @param user The user object for which the token is generated.
 * @param res The Express response object.
 * @returns The generated JWT token.
 */
export function generateToken(user: User, res: Response) {
  const payload: JwtPayload = {
    id: user.id,
  };

  const secret = process.env.JWT_SECRET!;

  const token = jwt.sign(payload, secret, {
    expiresIn: "7d",
  });

  // Add to cookie
  res.cookie("jwt", token, {
    httpOnly: true, // prevent from accessing via JS from client side
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  return token;
}
