import type { RequestHandler } from "express";

const getTrees: RequestHandler = (req, res) => {
  res.json({ message: "test" });
};

const createTree: RequestHandler = (req, res) => {
  res.json({ message: "test" });
};

const getTree: RequestHandler = (req, res) => {
  res.json({ message: "test" });
};

const deleteTree: RequestHandler = (req, res) => {
  res.json({ message: "test" });
};

export { getTrees, createTree, getTree, deleteTree };
