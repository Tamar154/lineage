export type TreeResponse = {
  status: "success";
  data: {
    id: string;
    name: string;
    normalizedName: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
};
