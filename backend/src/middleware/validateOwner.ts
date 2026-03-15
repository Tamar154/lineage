import type { RequestHandler } from "express";
import { prisma } from "../config/db.js";
import AppError from "../utils/AppError.js";

type TreeParams = {
  treeId: string;
};

/**
 * Middleware to validate that the tree being accessed belongs to the authenticated user.
 * Upon success, it attaches the tree to the request object for later use.
 */
export const validateOwner: RequestHandler<TreeParams> = async (
  req,
  res,
  next,
) => {
  const treeId = req.params.treeId;

  const tree = await prisma.tree.findFirst({
    where: {
      id: treeId,
      ownerId: req.user!.id,
    },
  });

  if (!tree) {
    throw new AppError(
      "Tree not found or you do not have permission to access it",
      404,
    );
  }

  // Attach the tree to the request object for later use
  req.tree = tree;
  next();
};
