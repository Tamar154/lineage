import type { RequestHandler } from "express";
import { prisma } from "../config/db.js";
import AppError from "../utils/AppError.js";
import type { GraphResponse } from "../types/graph.js";

export const getGraph: RequestHandler<
  { treeId: string },
  GraphResponse,
  Record<string, never>
> = async (req, res) => {
  const { treeId } = req.params;

  const tree = await prisma.tree.findFirst({
    where: { id: treeId },
    include: {
      persons: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          birthDate: true,
          deathDate: true,
          bio: true,
        },
      },
      relationships: {
        select: { id: true, personAId: true, personBId: true, type: true },
      },
    },
  });

  if (!tree) throw new AppError("Tree not found", 404);

  res.status(200).json({
    status: "success",
    data: tree,
  });
};
