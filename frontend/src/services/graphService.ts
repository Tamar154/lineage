import api from "../api/axios";

import type { Person as GraphPerson } from "./personService";

export type Relationship = {
  id: string;
  personAId: string;
  personBId: string;
  type: "PARENT_CHILD" | "SPOUSE";
};

export type GraphData = {
  id: string;
  name: string;
  persons: GraphPerson[];
  relationships: Relationship[];
};

type GetGraphParams = {
  treeId: string;
};

export const getGraph = async ({ treeId }: GetGraphParams) => {
  const res = await api.get(`/trees/${treeId}/graph`);
  return res.data;
};
