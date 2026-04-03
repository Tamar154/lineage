import api from "../api/axios";

type RegisterData = {
  email: string;
  password: string;
  name: string;
};

export const register = async (data: RegisterData) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};
