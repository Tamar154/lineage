import api from "../api/axios";

type CreateTreeData = {
  name: string;
};

export const getTrees = async () => {
  const response = await api.get("/trees");
  return response.data;
};

export const createTree = async (data: CreateTreeData) => {
  const response = await api.post("/trees", data);
  return response.data;
};
