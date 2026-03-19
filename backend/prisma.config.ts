import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const url =
  env("NODE_ENV") === "test" ? env("TEST_DIRECT_URL") : env("DIRECT_URL");

if (!url) {
  throw new Error("Database URL is not defined in environment variables");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url,
  },
});
