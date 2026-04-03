import api from "../api/axios";

type RegisterData = {
  email: string;
  password: string;
  name: string;
};

type LoginData = {
  email: string;
  password: string;
};

export const register = async (data: RegisterData) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

export const login = async (data: LoginData) => {
  const reponse = await api.post("auth/login", data);
  return reponse.data;
};
