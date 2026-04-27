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
    treeId,
    type: type.toUpperCase(),
    personAId: sourcePersonId,
    personBId: targetPersonId,
  });

  return res.data;
};
