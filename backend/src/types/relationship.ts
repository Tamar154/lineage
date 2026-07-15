import type { RelationshipType } from "../generated/prisma/index.js";

export type RelationshipResponse = {
  status: "success";
  data: {
    id: string;
    personAId: string;
    personBId: string;
    type: RelationshipType;
  };
};
