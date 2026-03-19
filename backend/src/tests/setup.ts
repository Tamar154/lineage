import { beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "../config/db.js";

beforeAll(async () => {
  await prisma.$connect();
});

beforeEach(async () => {
  // Clear all tables before each test
  console.log("Clearing database...");
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "User", "Tree", "Person", "Relationship" RESTART IDENTITY CASCADE;`,
  );
});

afterAll(async () => {
  await prisma.$disconnect();
});
