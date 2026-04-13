import api from "../api/axios";

export type Person = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  deathDate?: string;
  bio?: string;
};

type PersonFormData = {
  firstName: string;
  lastName: string;
  birthDate?: string;
  deathDate?: string;
  bio?: string;
};

type TreeIdParams = {
  treeId: string;
};

type PersonParams = {
  treeId: string;
  personId: string;
};

type CreatePersonParams = {
  treeId: string;
  data: PersonFormData;
};

type UpdatePersonParams = {
  treeId: string;
  personId: string;
  data: PersonFormData;
};

export const createPerson = async ({ treeId, data }: CreatePersonParams) => {
  const response = await api.post(`/trees/${treeId}/persons`, data);
  return response.data;
};

export const getAllPersons = async ({ treeId }: TreeIdParams) => {
  const response = await api.get(`/trees/${treeId}/persons`);
  return response.data;
};

export const getPerson = async ({ treeId, personId }: PersonParams) => {
  const response = await api.get(`/trees/${treeId}/persons/${personId}`);
  return response.data;
};

export const updatePerson = async ({
  treeId,
  personId,
  data,
}: UpdatePersonParams) => {
  const response = await api.put(`/trees/${treeId}/persons/${personId}`, data);
  return response.data;
};

export const deletePerson = async ({ treeId, personId }: PersonParams) => {
  const response = await api.delete(`/trees/${treeId}/persons/${personId}`);
  return response.data;
};
