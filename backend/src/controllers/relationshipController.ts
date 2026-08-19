import type { RequestHandler } from "express";
import { prisma } from "../config/db.js";
import AppError from "../utils/AppError.js";
import type {
  CreateRelationshipInput,
  RelationshipParams,
} from "../validators/relationshipValidators.js";
import {
  createRelationshipRecord,
  translateRelationshipRequest,
} from "../services/relationshipService.js";
import type { ApiSuccess } from "../dtos/apiSuccess.js";
import { toRelationshipDto, type RelationshipDto } from "../dtos/relationshipDto.js";

const createRelationship: RequestHandler<
  Record<string, never>,
  ApiSuccess<RelationshipDto>,
  CreateRelationshipInput
> = async (req, res) => {
  const treeId = req.tree.id;
  const relationshipWrite = translateRelationshipRequest(req.body);

  const relationship = await createRelationshipRecord({
    treeId,
    ...relationshipWrite,
  });

  res.status(201).json({
    data: toRelationshipDto(relationship),
  });
};

const deleteRelationship: RequestHandler<RelationshipParams> = async (
  req,
  res,
) => {
  const { relationshipId } = req.params;
  const treeId = req.tree.id;

  // Check if relationship exists and belongs to the tree
  const existing = await prisma.relationship.findFirst({
    where: { id: relationshipId, treeId },
  });

  if (!existing) {
    throw new AppError("Relationship not found", 404);
  }

  await prisma.relationship.delete({
    where: { id: relationshipId },
  });

  res.status(204).send();
};

export {
  createRelationship,
  deleteRelationship,
};
