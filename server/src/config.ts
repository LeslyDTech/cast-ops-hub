import "dotenv/config";
import { z } from "zod";

// Validate environment once at startup so a missing variable fails loudly
// here instead of as a confusing error deep inside a request.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z
    .string({ error: "DATABASE_URL is missing. Copy server/.env.example to server/.env and fill it in." })
    .regex(/^postgres(ql)?:\/\//, "DATABASE_URL must be a postgres:// connection string"),
  // Interpolated into SET search_path (identifiers can't be bound as $1 params),
  // so it is restricted to a safe identifier pattern.
  DB_SCHEMA: z
    .string()
    .regex(/^[a-z_][a-z0-9_]*$/, "DB_SCHEMA must be a lowercase SQL identifier")
    .default("cast_ops"),
  DATABASE_CA_CERT: z.string().optional(),
  // TLS is on by default (Supabase requires it). CI's throwaway Postgres
  // container has no TLS, so it opts out explicitly.
  DATABASE_SSL: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
});

export const config = envSchema.parse(process.env);
