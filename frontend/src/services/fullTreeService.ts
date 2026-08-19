import api from "../api/axios";
import type { Person } from "./personService";
import type { Tree } from "./treeService";

export type Relationship = {
  id: string;
  personAId: string;
  personBId: string;
  type: "PARENT_CHILD" | "SPOUSE";
};

export type FullTree = {
  tree: Tree;
  people: Person[];
  relationships: Relationship[];
};

export const getFullTree = async ({ treeId }: { treeId: string }) => {
  const response = await api.get<{ data: FullTree }>(`/trees/${treeId}/full`);
  return response.data;
};
