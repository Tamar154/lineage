import { beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "../config/db.js";

beforeAll(async () => {
  await prisma.$connect();

  // Clear all tables before starting tests
  console.log("Clearing database...");
  await prisma.relationship.deleteMany();
  await prisma.person.deleteMany();
  await prisma.tree.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
