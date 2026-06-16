import type { RelationshipType } from "../generated/prisma/index.js";

export type GraphResponse = {
  status: "success";
  data: {
    id: string;
    name: string;
    persons: {
      id: string;
      firstName: string;
      lastName: string | null;
      gender: string | null;
      birthDate: Date | null;
      deathDate: Date | null;
      birthPlace: string | null;
      biography: string | null;
    }[];
    relationships: {
      id: string;
      personAId: string;
      personBId: string;
      type: RelationshipType;
    }[];
  };
};
