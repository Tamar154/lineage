import type { RequestHandler } from "express";
import { prisma } from "../config/db.js";
import AppError from "../utils/AppError.js";

const getTrees: RequestHandler = async (req, res) => {
  const trees = await prisma.tree.findMany({
    where: { ownerId: req.user!.id },
  });

  res.json({
    status: "success",
    data: trees,
  });
};

const createTree: RequestHandler = async (req, res) => {
  const { name } = req.body;

  console.log(name);

  // Check if there is already a tree with the same name for this user
  const sameName = await prisma.tree.findFirst({
    where: {
      name,
      ownerId: req.user!.id,
    },
  });

  if (sameName) {
    throw new AppError("name already exists", 400);
  }

  // Create the tree
  const tree = await prisma.tree.create({
    data: {
      name,
      ownerId: req.user!.id,
    },
  });

  res.json({
    status: "success",
    data: tree,
  });
};

const getTree: RequestHandler = async (req, res) => {
  res.json({ message: "test" });
};

const deleteTree: RequestHandler = async (req, res) => {
  res.json({ message: "test" });
};

export { getTrees, createTree, getTree, deleteTree };
