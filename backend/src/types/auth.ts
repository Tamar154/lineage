export type AuthResponse = {
  status: "success";
  data: {
    id: string;
    email: string;
    name: string;
  };
};
