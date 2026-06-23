import { authClient } from "../auth/authClient";

type RegisterData = {
  email: string;
  password: string;
  name: string;
};

type LoginData = {
  email: string;
  password: string;
};

const throwAuthError = (message?: string) => {
  throw new Error(message || "Authentication failed");
};

const getFrontendOrigin = () =>
  import.meta.env.VITE_FRONTEND_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:5173");

const getFrontendUrl = (path: string) =>
  `${getFrontendOrigin()}${path.startsWith("/") ? path : `/${path}`}`;

export const register = async (data: RegisterData) => {
  const { data: result, error } = await authClient.signUp.email(data);

  if (error) {
    throwAuthError(error.message);
  }

  return result;
};

export const login = async (data: LoginData) => {
  const { data: result, error } = await authClient.signIn.email(data);

  if (error) {
    throwAuthError(error.message);
  }

  return result;
};

export const loginWithGoogle = async () => {
  const { data, error } = await authClient.signIn.social({
    provider: "google",
    callbackURL: getFrontendUrl("/trees"),
    errorCallbackURL: getFrontendUrl("/login"),
  });

  if (error) {
    throwAuthError(error.message);
  }

  return data;
};

export const logout = async () => {
  const { error } = await authClient.signOut();

  if (error) {
    throwAuthError(error.message);
  }
};

export const getSession = () => authClient.getSession();

export const useSession = authClient.useSession;
