import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaNeon } from "@prisma/adapter-neon";

const DB_URL =
  process.env.NODE_ENV === "test"
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;

if (!DB_URL) {
  throw new Error("Database URL is not defined in environment variables");
}

const adapter = new PrismaNeon({
  connectionString: DB_URL!,
});

export const prisma = new PrismaClient({ adapter });
