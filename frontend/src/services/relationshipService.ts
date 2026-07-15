import api from "../api/axios";

type CreateRelationshipParams = {
  treeId: string;
  type: "parent" | "spouse";
  sourcePersonId: string;
  targetPersonId: string;
};

export const createRelationship = async ({
  treeId,
  type,
  sourcePersonId,
  targetPersonId,
}: CreateRelationshipParams) => {
  const res = await api.post(`/trees/${treeId}/relationships`, {
    type: type === "parent" ? "PARENT_CHILD" : "SPOUSE",
    personAId: sourcePersonId,
    personBId: targetPersonId,
  });

  return res.data;
};
