import type { RequestHandler } from "express";
import AppError from "../utils/AppError.js";
import { prisma } from "../config/db.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/generateToken.js";
import type {
  LoginInput,
  RegisterInput,
} from "../validators/authValidators.js";

const register: RequestHandler<{}, {}, RegisterInput> = async (req, res) => {
  const { email, password, name } = req.body;

  // Normalize email
  const normalizedEmail = email.trim().toLowerCase();

  // Check if email already exists
  const userExists = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (userExists) {
    throw new AppError("Email already exists", 400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Save user to DB
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashedPassword,
      name: name ?? normalizedEmail.split("@")[0]!,
    },
  });

  // Generate JWT token and set cookie
  generateToken(user, res);

  res.status(201).json({
    status: "success",
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
};

const login: RequestHandler<{}, {}, LoginInput> = async (req, res) => {
  const { email, password } = req.body;

  const normalizedEmail = email.trim().toLowerCase();

  // Check if credentials are valid
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  const validPassword = user
    ? await bcrypt.compare(password, user.password)
    : false;

  if (!user || !validPassword) {
    throw new AppError("Unauthorized", 401);
  }

  // Generate a jwt token
  generateToken(user, res);

  res.status(200).json({
    status: "success",
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
};

const logout: RequestHandler = (req, res) => {
  // Clear the JWT cookie
  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: "strict",
  });

  res.json({ status: "success" });
};

export { register, login, logout };
