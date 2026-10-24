import { defineConfig } from "vitest/config";

// Tests always run against the isolated test schema, whatever server/.env says.
// dotenv never overrides variables that are already set, and workers inherit this.
process.env.DB_SCHEMA = "cast_ops_test";
process.env.NODE_ENV = "test";

export default defineConfig({
  test: {
    environment: "node",
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "api",
          include: ["tests/api/**/*.test.ts"],
          // Rebuilds the test schema from migrations once per run.
          globalSetup: ["tests/helpers/global-setup.ts"],
          // Files share one database schema, so they must not run concurrently.
          fileParallelism: false,
          testTimeout: 20_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
