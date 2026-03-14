import type { RequestHandler } from "express";
import { prisma } from "../config/db.js";
import AppError from "../utils/AppError.js";

const getTrees: RequestHandler = async (req, res) => {
  // Find all trees that belong to the authenticated user
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

  res.status(201).json({
    status: "success",
    data: tree,
  });
};

const getTree: RequestHandler = async (req, res) => {
  const id = req.params.id;

  const tree = req.tree!; // This is set by the validateOwner middleware

  res.json({
    status: "success",
    data: tree,
  });
};

const deleteTree: RequestHandler = async (req, res) => {
  // Delete the tree
  await prisma.tree.delete({
    where: {
      id: req.tree!.id, // This is set by the validateOwner middleware
    },
  });

  res.status(204).send();
};

export { getTrees, createTree, getTree, deleteTree };
