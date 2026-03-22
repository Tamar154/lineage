import type { RequestHandler } from "express";
import { prisma } from "../config/db.js";
import AppError from "../utils/AppError.js";
import type { CreateRelInput } from "../validators/relationshipValidators.js";
import { RelationshipType } from "../generated/prisma/index.js";

const createRelationship: RequestHandler<{}, {}, CreateRelInput> = async (
  req,
  res,
) => {
  const { personAId, personBId, type } = req.body;
  const treeId = req.tree!.id;

  // Validate that a person cannot have a relationship with themselves
  if (personAId === personBId) {
    throw new AppError("A person cannot relate to themselves", 400);
  }

  // Validate that both persons belong to the same tree
  const persons = await prisma.person.findMany({
    where: {
      id: { in: [personAId, personBId] },
      treeId,
    },
  });

  if (persons.length !== 2) {
    throw new AppError("Both persons must belong to the same tree", 400);
  }

  // Check if relationship already exists + prevent reversed duplicates
  // TODO: Good for undirected relationships (sibling or spouse), potential issues with directed relationships (parent-child) => may need to consider direction in the future
  const existing = await prisma.relationship.findFirst({
    where: {
      treeId,
      type,
      // Check for both directions if it's a SPOUSE relationship, otherwise check only the specified direction
      OR: [
        { personAId, personBId },
        ...(type === RelationshipType.SPOUSE
          ? [{ personAId: personBId, personBId: personAId }]
          : []),
      ],
    },
  });

  if (existing) {
    throw new AppError("Relationship already exists", 400);
  }

  if (type === RelationshipType.PARENT) {
    // Prevent circular relationships (e.g. A is parent of B, B is parent of A)
    const circular = await prisma.relationship.findFirst({
      where: {
        treeId,
        type: RelationshipType.PARENT,
        personAId: personBId,
        personBId: personAId,
      },
    });

    if (circular) {
      throw new AppError("Circular relationship detected", 400);
    }
  }

  // Create new relationship
  const relationship = await prisma.relationship.create({
    data: {
      treeId,
      personAId,
      personBId,
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

const getRelationshipById: RequestHandler = async (req, res) => {};
const updateRelationship: RequestHandler = async (req, res) => {};
const deleteRelationship: RequestHandler = async (req, res) => {};

export {
  createRelationship,
  getRelationships,
  getRelationshipById,
  updateRelationship,
  deleteRelationship,
};
