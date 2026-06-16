export type PersonResponse = {
  status: "success";
  data: {
    id: string;
    firstName: string;
    lastName: string | null;
    gender: string | null;
    birthDate: Date | null;
    deathDate: Date | null;
    birthPlace: string | null;
    biography: string | null;
  };
};

export type PersonsResponse = {
  status: "success";
  data: {
    id: string;
    firstName: string;
    lastName: string | null;
    gender: string | null;
    birthDate: Date | null;
    deathDate: Date | null;
    birthPlace: string | null;
    biography: string | null;
  }[];
};
