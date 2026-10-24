import { assertTestSchema } from "./test-schema.js";

// Runs once before the API tests: drop the test schema and rebuild it from the
// real migration files, so the tests also prove the migrations apply cleanly.
export default async function setup() {
  const schema = assertTestSchema();
  const { pool } = await import("../../src/db/pool.js");
  const { migrate } = await import("../../src/db/migrate.js");
  try {
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await migrate(() => {});
  } finally {
    await pool.end();
  }
}
