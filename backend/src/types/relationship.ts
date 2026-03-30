export type RelationshipResponse = {
  status: "success";
  data: {
    id: string;
    personAId: string;
    personBId: string;
    type: string;
  };
};
