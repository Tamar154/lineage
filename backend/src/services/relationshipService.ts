import AppError from "../utils/AppError.js";
import { prisma } from "../config/db.js";
import { RelationshipType } from "../generated/prisma/index.js";
import { normalizeRelationship } from "./normalizeRelationship.js";
import type { CreateRelationshipInput } from "../validators/relationshipValidators.js";
import { relationshipSelect } from "../dtos/relationshipDto.js";

/**
 * Validates that a proposed relationship between two persons is valid within the context of a tree.
 * Checks include:
 * - A person cannot have a relationship with themselves.
 * - Both persons must belong to the same tree.
 * - The same relationship cannot already exist.
 * - A person cannot have more than one spouse.
 * - For parent-child relationships, circular relationships are not allowed (e.g., A cannot be a parent of B if B is already a parent of A).
 * If any of these conditions are violated, an AppError is thrown with an appropriate message and status code.
 *
 * @param personAId - The ID of the first person in the relationship.
 * @param personBId - The ID of the second person in the relationship.
 * @param type - The type of relationship (PARENT_CHILD or SPOUSE).
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
    throw new AppError("VALIDATION_ERROR", {
      details: {
        formErrors: ["A person cannot have a relationship with themselves."],
      },
    });
  }

  // Validate that both persons belong to the same tree
  const persons = await prisma.person.findMany({
    where: {
      id: { in: [personAId, personBId] },
      treeId,
    },
  });

  if (persons.length !== 2) {
    throw new AppError("PERSON_NOT_IN_TREE");
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
    throw new AppError("RELATIONSHIP_ALREADY_EXISTS");
  }

  if (type === RelationshipType.SPOUSE) {
    const existingSpouse = await prisma.relationship.findFirst({
      where: {
        treeId,
        type: RelationshipType.SPOUSE,
        OR: [
          { personAId: { in: [personAId, personBId] } },
          { personBId: { in: [personAId, personBId] } },
        ],
        ...(currentRelId && { NOT: { id: currentRelId } }),
      },
    });

    if (existingSpouse) {
      throw new AppError("MAX_SPOUSE_LIMIT_REACHED");
    }
  }

  if (type === RelationshipType.PARENT_CHILD) {
    const circular = await prisma.relationship.findFirst({
      where: {
        treeId,
        type: RelationshipType.PARENT_CHILD,
        personAId: personBId,
        personBId: personAId,
        ...(currentRelId && { NOT: { id: currentRelId } }),
      },
    });

    if (circular) {
      throw new AppError("RELATIONSHIP_CYCLE_DETECTED");
    }
  }
}

type RelationshipWrite = {
  treeId: string;
  personAId: string;
  personBId: string;
  type: RelationshipType;
};

export const translateRelationshipRequest = (
  input: CreateRelationshipInput,
): Omit<RelationshipWrite, "treeId"> => {
  if (input.relation === "CHILD") {
    return {
      personAId: input.personBId,
      personBId: input.personAId,
      type: RelationshipType.PARENT_CHILD,
    };
  }

  return {
    personAId: input.personAId,
    personBId: input.personBId,
    type:
      input.relation === "PARENT"
        ? RelationshipType.PARENT_CHILD
        : RelationshipType.SPOUSE,
  };
};

export async function createRelationshipRecord(input: RelationshipWrite) {
  const normalized = normalizeRelationship(
    input.personAId,
    input.personBId,
    input.type,
  );

  await validateRelationship(
    normalized.personAId,
    normalized.personBId,
    input.type,
    input.treeId,
  );

  try {
    return await prisma.relationship.create({
      data: {
        treeId: input.treeId,
        ...normalized,
        type: input.type,
      },
      select: relationshipSelect,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new AppError("RELATIONSHIP_ALREADY_EXISTS");
    }
    throw error;
  }
}
