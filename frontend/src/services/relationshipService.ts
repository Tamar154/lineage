import api from "../api/axios";

type CreateRelationshipParams = {
  treeId: string;
  relation: "PARENT" | "CHILD" | "SPOUSE";
  sourcePersonId: string;
  targetPersonId: string;
};

export const createRelationship = async ({
  treeId,
  relation,
  sourcePersonId,
  targetPersonId,
}: CreateRelationshipParams) => {
  const res = await api.post(`/trees/${treeId}/relationships`, {
    relation,
    personAId: sourcePersonId,
    personBId: targetPersonId,
  });

  return res.data;
};
