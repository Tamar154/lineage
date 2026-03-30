export type PersonResponse = {
  status: "success";
  data: {
    id: string;
    firstName: string;
    lastName: string;
    birthDate: Date | null;
    deathDate: Date | null;
    bio: string | null;
  };
};

export type PersonsResponse = {
  status: "success";
  data: {
    id: string;
    firstName: string;
    lastName: string;
    birthDate: Date | null;
    deathDate: Date | null;
    bio: string | null;
  }[];
};
