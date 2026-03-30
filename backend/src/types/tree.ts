export type TreeResponse = {
  status: "success";
  data: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
};
