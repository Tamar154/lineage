import type { RelationshipType } from "../generated/prisma/index.js";

export type RelationshipDto = {
  id: string;
  personAId: string;
  personBId: string;
  type: RelationshipType;
};

export const relationshipSelect = {
  id: true,
  personAId: true,
  personBId: true,
  type: true,
} as const;

export const toRelationshipDto = (
  relationship: RelationshipDto,
): RelationshipDto => ({
  id: relationship.id,
  personAId: relationship.personAId,
  personBId: relationship.personBId,
  type: relationship.type,
});
