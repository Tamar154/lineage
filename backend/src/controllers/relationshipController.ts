import type { RequestHandler } from "express";
import { prisma } from "../config/db.js";
import AppError from "../utils/AppError.js";
import type {
  RelationshipInput,
  RelationshipParams,
} from "../validators/relationshipValidators.js";
import { validateRelationship } from "../services/relationshipService.js";
import { normalizeRelationship } from "../services/normalizeRelationship.js";

const createRelationship: RequestHandler<{}, {}, RelationshipInput> = async (
  req,
  res,
) => {
  const { personAId, personBId, type } = req.body;
  const treeId = req.tree.id;

  // Normalize the relationship to enforce unique constraint regardless of order
  const normalized = normalizeRelationship(personAId, personBId, type);

  await validateRelationship(
    normalized.personAId,
    normalized.personBId,
    type,
    treeId,
  );

  // Create new relationship
  const relationship = await prisma.relationship.create({
    data: {
      treeId,
      personAId: normalized.personAId,
      personBId: normalized.personBId,
      type,
    },
  });

  res.status(201).json({
    status: "success",
    data: {
      id: relationship.id,
      personAId: relationship.personAId,
      personBId: relationship.personBId,
      type: relationship.type,
    },
  });
};

const getRelationships: RequestHandler = async (req, res) => {
  const relationships = await prisma.relationship.findMany({
    where: { treeId: req.tree.id },
  });

  res.json({
    status: "success",
    data: relationships.map((r) => ({
      id: r.id,
      personAId: r.personAId,
      personBId: r.personBId,
      type: r.type,
    })),
  });
};

const getRelationshipById: RequestHandler<RelationshipParams, {}, {}> = async (
  req,
  res,
) => {
  const { id } = req.params;

  const relationship = await prisma.relationship.findFirst({
    where: { id, treeId: req.tree.id },
  });

  if (!relationship) {
    throw new AppError("Relationship not found", 404);
  }

  res.json({
    status: "success",
    data: {
      id: relationship.id,
      personAId: relationship.personAId,
      personBId: relationship.personBId,
      type: relationship.type,
    },
  });
};

const updateRelationship: RequestHandler<
  RelationshipParams,
  {},
  RelationshipInput
> = async (req, res) => {
  const { id } = req.params;
  const { personAId, personBId, type } = req.body;
  const treeId = req.tree.id;

  // Check if relationship exists and belongs to the tree
  const existing = await prisma.relationship.findFirst({
    where: { id, treeId },
  });

  if (!existing) {
    throw new AppError("Relationship not found", 404);
  }

  const normalized = normalizeRelationship(personAId, personBId, type);

  await validateRelationship(
    normalized.personAId,
    normalized.personBId,
    type,
    treeId,
    id,
  );

  // Update relationship
  const updated = await prisma.relationship.update({
    where: { id },
    data: {
      personAId: normalized.personAId,
      personBId: normalized.personBId,
      type,
    },
  });

  res.json({
    status: "success",
    data: {
      id: updated.id,
      personAId: updated.personAId,
      personBId: updated.personBId,
      type: updated.type,
    },
  });
};

const deleteRelationship: RequestHandler<RelationshipParams, {}, {}> = async (
  req,
  res,
) => {
  const { id } = req.params;
  const treeId = req.tree.id;

  // Check if relationship exists and belongs to the tree
  const existing = await prisma.relationship.findFirst({
    where: { id, treeId },
  });

  if (!existing) {
    throw new AppError("Relationship not found", 404);
  }

  await prisma.relationship.delete({
    where: { id },
  });

  res.status(204).send();
};

export {
  createRelationship,
  getRelationships,
  getRelationshipById,
  updateRelationship,
  deleteRelationship,
};
