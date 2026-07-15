import type { RequestHandler } from "express";
import { prisma } from "../config/db.js";
import AppError from "../utils/AppError.js";

import type {
  CreateTreeInput,
  UpdateTreeInput,
} from "../validators/treeValidators.js";
import type { TreeResponse } from "../types/tree.js";
import { normalizeTreeName } from "../utils/normalization.js";

const isUniqueConstraintError = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error && error.code === "P2002";

const getTrees: RequestHandler = async (req, res) => {
  // Find all trees that belong to the authenticated user
  const trees = await prisma.tree.findMany({
    where: { ownerId: req.user.id },
  });

  res.json({
    status: "success",
    data: trees,
  });
};

const createTree: RequestHandler<
  Record<string, never>,
  TreeResponse,
  CreateTreeInput
> = async (req, res) => {
  const { name, description } = req.body;
  const normalized = normalizeTreeName(name);

  // Check if there is already a tree with the same name for this user
  const sameName = await prisma.tree.findFirst({
    where: {
      normalizedName: normalized.normalizedName,
      ownerId: req.user.id,
    },
  });

  if (sameName) {
    throw new AppError("name already exists", 400);
  }

  // Create the tree
  let tree;
  try {
    tree = await prisma.tree.create({
      data: {
        ...normalized,
        description: description ?? null,
        ownerId: req.user.id,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError("name already exists", 400);
    }
    throw error;
  }

  res.status(201).json({
    status: "success",
    data: tree,
  });
};

const updateTree: RequestHandler<
  { treeId: string },
  TreeResponse,
  UpdateTreeInput
> = async (req, res) => {
  const nameFields = req.body.name
    ? normalizeTreeName(req.body.name)
    : {};

  try {
    const tree = await prisma.tree.update({
      where: { id: req.tree.id },
      data: {
        ...nameFields,
        ...(req.body.description !== undefined && {
          description: req.body.description,
        }),
      },
    });
    res.json({ status: "success", data: tree });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError("name already exists", 400);
    }
    throw error;
  }
};

const getTree: RequestHandler = (req, res) => {
  const tree = req.tree; // This is set by the validateOwner middleware

  res.json({
    status: "success",
    data: tree,
  });
};

const deleteTree: RequestHandler = async (req, res) => {
  // Delete the tree
  await prisma.tree.delete({
    where: {
      id: req.tree.id, // This is set by the validateOwner middleware
    },
  });

  res.status(204).send();
};

export { getTrees, createTree, getTree, updateTree, deleteTree };
