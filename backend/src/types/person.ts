import type { DatePrecision, Gender } from "../generated/prisma/index.js";

export type PersonData = {
  id: string;
  firstName: string;
  lastName: string | null;
  gender: Gender;
  birthDate: string | null;
  birthDatePrecision: DatePrecision | null;
  deathDate: string | null;
  deathDatePrecision: DatePrecision | null;
  birthPlace: string | null;
  biography: string | null;
};

export type PersonResponse = {
  status: "success";
  data: PersonData;
};

export type PersonsResponse = {
  status: "success";
  data: PersonData[];
};
