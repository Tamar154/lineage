import { RelationshipType } from "../generated/prisma/index.js";

/**
 * Normalizes a relationship by ordering person IDs for symmetric relationships (e.g., SPOUSE).
 * For asymmetric relationships (e.g., PARENT), the order is preserved.
 *
 * @param personAId - The ID of the first person in the relationship
 * @param personBId - The ID of the second person in the relationship
 * @param type - The type of relationship (e.g., PARENT, SPOUSE)
 * @returns Normalized relationship with ordered person IDs
 */
export const normalizeRelationship = (
  personAId: string,
  personBId: string,
  type: RelationshipType,
) => {
  if (type === RelationshipType.SPOUSE) {
    return personAId < personBId
      ? { personAId, personBId }
      : { personAId: personBId, personBId: personAId };
  }

  return { personAId, personBId };
};
