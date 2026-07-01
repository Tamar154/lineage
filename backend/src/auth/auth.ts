import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "../config/db.js";

const betterAuthSecret =
  process.env.BETTER_AUTH_SECRET ??
  (process.env.NODE_ENV === "test"
    ? "test-better-auth-secret-at-least-32-characters"
    : undefined);

if (!betterAuthSecret) {
  throw new Error("BETTER_AUTH_SECRET is required");
}

const isTest = process.env.NODE_ENV === "test";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!isTest && (!googleClientId || !googleClientSecret)) {
  throw new Error(
    "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required outside tests",
  );
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: betterAuthSecret,
  trustedOrigins: [process.env.FRONTEND_ORIGIN ?? "http://localhost:5173"],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    ...(googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : {}),
  },
});
