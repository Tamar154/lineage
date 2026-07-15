import type { RelationshipType } from "../generated/prisma/index.js";
import type { PersonData } from "./person.js";

export type GraphResponse = {
  status: "success";
  data: {
    id: string;
    name: string;
    normalizedName: string;
    description: string | null;
    persons: PersonData[];
    relationships: {
      id: string;
      personAId: string;
      personBId: string;
      type: RelationshipType;
    }[];
  };
};
