import api from "../api/axios";

export type Person = {
  id: string;
  firstName: string;
  lastName: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | "UNKNOWN";
  birthDate: string | null;
  birthDatePrecision: "YEAR" | "MONTH" | "DAY" | null;
  deathDate: string | null;
  deathDatePrecision: "YEAR" | "MONTH" | "DAY" | null;
  birthPlace: string | null;
  biography: string | null;
};

type PersonFormData = {
  firstName: string;
  lastName: string | null;
  birthDate: string | null;
  birthDatePrecision: "YEAR" | "MONTH" | "DAY" | null;
  deathDate: string | null;
  deathDatePrecision: "YEAR" | "MONTH" | "DAY" | null;
  biography: string | null;
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
  const response = await api.post(`/trees/${treeId}/people`, data);
  return response.data;
};

export const updatePerson = async ({
  treeId,
  personId,
  data,
}: UpdatePersonParams) => {
  const response = await api.patch(`/trees/${treeId}/people/${personId}`, data);
  return response.data;
};

export const deletePerson = async ({ treeId, personId }: PersonParams) => {
  const response = await api.delete(`/trees/${treeId}/people/${personId}`);
  return response.data;
};
