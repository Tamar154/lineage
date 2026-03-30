import type { RelationshipType } from "../generated/prisma/index.js";

export type GraphResponse = {
  status: "success";
  data: {
    id: string;
    name: string;
    persons: {
      id: string;
      firstName: string;
      lastName: string;
      birthDate: Date | null;
      deathDate: Date | null;
      bio: string | null;
    }[];
    relationships: {
      id: string;
      personAId: string;
      personBId: string;
      type: RelationshipType;
    }[];
  };
};
