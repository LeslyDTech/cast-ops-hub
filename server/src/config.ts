import "dotenv/config";
import { z } from "zod";

// Validate environment once at startup so a missing variable fails loudly
// here instead of as a confusing error deep inside a request.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
});

export const config = envSchema.parse(process.env);
