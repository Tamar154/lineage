import type { RequestHandler } from "express";
import { prisma } from "../config/db.js";
import AppError from "../utils/AppError.js";

type TreeParams = {
  id: string;
};

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

const getTree: RequestHandler<TreeParams> = async (req, res) => {
  const id = req.params.id;

  console.log(id);

  // Find the tree and ensure it belongs to the authenticated user
  const tree = await prisma.tree.findFirst({
    where: {
      id,
      ownerId: req.user!.id,
    },
  });

  if (!tree) {
    throw new AppError("Tree not found", 404);
  }

  res.json({
    status: "success",
    data: tree,
  });
};

const deleteTree: RequestHandler<TreeParams> = async (req, res) => {
  const id = req.params.id;

  // Find the tree and ensure it belongs to the authenticated user
  const tree = await prisma.tree.findFirst({
    where: {
      id,
      ownerId: req.user!.id,
    },
  });

  if (!tree) {
    throw new AppError("Tree not found", 404);
  }

  // Delete the tree
  await prisma.tree.delete({
    where: {
      id,
    },
  });

  res.status(204).send();
};

export { getTrees, createTree, getTree, deleteTree };
