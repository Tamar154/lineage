import type { RequestHandler } from "express";

const getTrees: RequestHandler = (req, res) => {
  res.json({ message: "test" });
};

export { getTrees };
