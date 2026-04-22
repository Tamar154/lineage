import api from "../api/axios";

export type GraphPerson = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  deathDate?: string;
  bio?: string;
};

export type GraphRelationship = {
  id: string;
  personAId: string;
  personBId: string;
  type: "PARENT" | "SPOUSE";
};

export type GraphData = {
  id: string;
  name: string;
  persons: GraphPerson[];
  relationships: GraphRelationship[];
};

type GetGraphParams = {
  treeId: string;
};

export const getGraph = async ({ treeId }: GetGraphParams) => {
  const res = await api.get(`/trees/${treeId}/graph`);
  return res.data;
};
