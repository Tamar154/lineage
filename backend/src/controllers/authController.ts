import type { RequestHandler } from "express";
import AppError from "../utils/AppError.js";
import { prisma } from "../config/db.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/generateToken.js";

const register: RequestHandler = async (req, res) => {
  const { email, password, name } = req.body;

  // Check if email and password are given
  if (!email || !password) {
    throw new AppError("Missing credentials", 400);
  }

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
      name: name ?? normalizedEmail.split("@")[0],
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

const login: RequestHandler = async (req, res) => {
  res.json({ message: "login" });
};

const logout: RequestHandler = async (req, res) => {
  res.json({ message: "logout" });
};

export { register, login, logout };
