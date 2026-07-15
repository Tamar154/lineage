export type PersonFormData = {
  firstName: string;
  lastName: string | null;
  birthDate: string | null;
  birthDatePrecision: "YEAR" | "MONTH" | "DAY" | null;
  deathDate: string | null;
  deathDatePrecision: "YEAR" | "MONTH" | "DAY" | null;
  biography: string | null;
};
