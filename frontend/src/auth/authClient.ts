import { createAuthClient } from "better-auth/react";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
});
