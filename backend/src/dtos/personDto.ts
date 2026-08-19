import type { DatePrecision, Gender } from "../generated/prisma/index.js";

export type PersonDto = {
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

export const personSelect = {
  id: true,
  firstName: true,
  lastName: true,
  gender: true,
  birthDate: true,
  birthDatePrecision: true,
  deathDate: true,
  deathDatePrecision: true,
  birthPlace: true,
  biography: true,
} as const;

export const toPersonDto = (person: PersonDto): PersonDto => ({
  id: person.id,
  firstName: person.firstName,
  lastName: person.lastName,
  gender: person.gender,
  birthDate: person.birthDate,
  birthDatePrecision: person.birthDatePrecision,
  deathDate: person.deathDate,
  deathDatePrecision: person.deathDatePrecision,
  birthPlace: person.birthPlace,
  biography: person.biography,
});
