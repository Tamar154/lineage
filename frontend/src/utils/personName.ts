import type { Person } from "../services/personService";

type PersonName = Pick<Person, "firstName" | "lastName">;

export const getPersonDisplayName = (person: PersonName) =>
  [person.firstName, person.lastName].filter(Boolean).join(" ");
