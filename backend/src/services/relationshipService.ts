import AppError from "../utils/AppError.js";
import { prisma } from "../config/db.js";
import { RelationshipType } from "../generated/prisma/index.js";

/**
 * Validates that a proposed relationship between two persons is valid within the context of a tree.
 * Checks include:
 * - A person cannot have a relationship with themselves.
 * - Both persons must belong to the same tree.
 * - The same pair of people cannot have more than one relationship.
 * - A person can have at most one spouse.
 * - A child can have at most two parents.
 * - For parent-child relationships, circular relationships are not allowed.
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

  const existingPair = await prisma.relationship.findFirst({
    where: {
      treeId,
      OR: [
        { personAId, personBId },
        { personAId: personBId, personBId: personAId },
      ],
      ...(currentRelId && { NOT: { id: currentRelId } }),
    },
  });

  if (existingPair) {
    throw new AppError(
      "A relationship between these people already exists",
      400,
    );
  }

  if (type === RelationshipType.SPOUSE) {
    const existingSpouse = await prisma.relationship.findFirst({
      where: {
        treeId,
        type: RelationshipType.SPOUSE,
        OR: [
          { personAId },
          { personBId: personAId },
          { personAId: personBId },
          { personBId },
        ],
        ...(currentRelId && { NOT: { id: currentRelId } }),
      },
    });

    if (existingSpouse) {
      throw new AppError("A person can have at most one spouse", 400);
    }
  }

  if (type === RelationshipType.PARENT) {
    const parentCount = await prisma.relationship.count({
      where: {
        treeId,
        type: RelationshipType.PARENT,
        personBId,
        ...(currentRelId && { NOT: { id: currentRelId } }),
      },
    });

    if (parentCount >= 2) {
      throw new AppError("A child can have at most two parents", 400);
    }

    const parentRelationships = await prisma.relationship.findMany({
      where: {
        treeId,
        type: RelationshipType.PARENT,
        ...(currentRelId && { NOT: { id: currentRelId } }),
      },
      select: {
        personAId: true,
        personBId: true,
      },
    });

    const childrenByParent = new Map<string, string[]>();
    for (const relationship of parentRelationships) {
      const children = childrenByParent.get(relationship.personAId) ?? [];
      children.push(relationship.personBId);
      childrenByParent.set(relationship.personAId, children);
    }

    const visited = new Set<string>();
    const stack = [personBId];

    while (stack.length > 0) {
      const currentPersonId = stack.pop();
      if (!currentPersonId || visited.has(currentPersonId)) continue;

      if (currentPersonId === personAId) {
        throw new AppError(
          "Circular parent-child relationships are not allowed",
          400,
        );
      }

      visited.add(currentPersonId);
      stack.push(...(childrenByParent.get(currentPersonId) ?? []));
    }
  }
}
