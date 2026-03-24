import AppError from "../utils/AppError.js";
import { prisma } from "../config/db.js";
import { RelationshipType } from "../generated/prisma/index.js";

/**
 * Validates that a proposed relationship between two persons is valid within the context of a tree.
 * Checks include:
 * - A person cannot have a relationship with themselves.
 * - Both persons must belong to the same tree.
 * - The same relationship cannot already exist.
 * - For parent-child relationships, circular relationships are not allowed (e.g., A cannot be a parent of B if B is already a parent of A).
 * If any of these conditions are violated, an AppError is thrown with an appropriate message and status code.
 *
 * @param personAId - The ID of the first person in the relationship.
 * @param personBId - The ID of the second person in the relationship.
 * @param type - The type of relationship (e.g., PARENT, SPOUSE).
 * @param treeId - The ID of the tree to which both persons belong.
 * @throws {AppError} If the relationship is invalid for any reason.
 */
export async function validateRelationship(
  personAId: string,
  personBId: string,
  type: RelationshipType,
  treeId: string,
  currentRelId?: string,
): Promise<void> {
  // Check for self-relationship
  if (personAId === personBId) {
    throw new AppError(
      "A person cannot have a relationship with themselves",
      400,
    );
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

  const existing = await prisma.relationship.findFirst({
    where: {
      treeId,
      type,
      personAId,
      personBId,
      ...(currentRelId && { NOT: { id: currentRelId } }),
    },
  });

  if (existing) {
    throw new AppError("This relationship already exists", 400);
  }

  if (type === RelationshipType.PARENT) {
    const circular = await prisma.relationship.findFirst({
      where: {
        treeId,
        type: RelationshipType.PARENT,
        personAId: personBId,
        personBId: personAId,
        ...(currentRelId && { NOT: { id: currentRelId } }),
      },
    });

    if (circular) {
      throw new AppError(
        "Circular parent-child relationships are not allowed",
        400,
      );
    }
  }
}
