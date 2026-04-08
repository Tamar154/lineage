import api from "../api/axios";

type CreateTreeData = {
  name: string;
};

type GetTreeByIdData = {
  treeId: string;
};

type ApiResponse<T> = {
  status: string;
  data: T;
};

export type Tree = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export const getTrees = async (): Promise<ApiResponse<Tree[]>> => {
  const response = await api.get("/trees");
  return response.data;
};

export const createTree = async (
  data: CreateTreeData,
): Promise<ApiResponse<Tree>> => {
  const response = await api.post("/trees", data);
  return response.data;
};

export const getTreeById = async (
  data: GetTreeByIdData,
): Promise<ApiResponse<Tree>> => {
  const response = await api.get(`/trees/${data.treeId}`);
  return response.data;
};

export const deleteTree = async (data: GetTreeByIdData) => {
  const response = await api.delete(`/trees/${data.treeId}`);
  return response.data;
};
