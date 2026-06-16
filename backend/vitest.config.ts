import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./src/tests/setup.ts"],
    hookTimeout: 60_000,
    env: {
      NODE_ENV: "test",
    },
  },
});
