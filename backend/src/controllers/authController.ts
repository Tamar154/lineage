import type { RequestHandler } from "express";

const register: RequestHandler = async (req, res) => {
  res.json({ message: "Register" });
};

const login: RequestHandler = async (req, res) => {
  res.json({ message: "login" });
};

const logout: RequestHandler = async (req, res) => {
  res.json({ message: "logout" });
};

export { register, login, logout };
