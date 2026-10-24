import { readFileSync } from "node:fs";
import pg from "pg";
import { config } from "../config.js";

const { Pool } = pg;

// Supabase requires TLS. Its certificate is signed by Supabase's own CA, which
// isn't in Node's trust store, so full verification needs the CA file. Without
// it the connection is still encrypted, just not verified.
const ssl = config.DATABASE_CA_CERT
  ? { ca: readFileSync(config.DATABASE_CA_CERT, "utf8"), rejectUnauthorized: true }
  : { rejectUnauthorized: false };

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  ssl,
  // Sent at connection startup, so every session resolves unqualified table
  // names against our schema before its first query, with no extra round trip.
  options: `-c search_path=${config.DB_SCHEMA}`,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

// An idle client erroring (e.g. the server dropped it) must not crash the process.
pool.on("error", (err) => {
  console.error("Unexpected idle Postgres client error", err);
});

// Repository functions accept either the pool or a checked-out client, so the
// same SQL can run standalone or inside a caller's transaction.
export type Queryable = Pick<pg.Pool | pg.PoolClient, "query">;

export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    client.release();
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
      client.release();
    } catch (rollbackErr) {
      // The connection is in an unknown state; destroy it instead of reusing it.
      client.release(rollbackErr as Error);
    }
    throw err;
  }
}
