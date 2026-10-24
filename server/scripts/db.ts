// CLI for database tasks: tsx scripts/db.ts <migrate|seed|reset>
import { config } from "../src/config.js";
import { migrate } from "../src/db/migrate.js";
import { pool } from "../src/db/pool.js";
import { seed } from "../src/db/seed.js";

const command = process.argv[2];

async function main() {
  console.log(`[db] ${command} on schema "${config.DB_SCHEMA}"`);
  switch (command) {
    case "migrate": {
      const applied = await migrate();
      if (applied.length === 0) console.log("  already up to date");
      break;
    }
    case "seed":
      await seed();
      break;
    case "reset":
      // Destructive, so it refuses to touch Supabase's shared default schema.
      if (config.DB_SCHEMA === "public") throw new Error("Refusing to drop the public schema");
      await pool.query(`DROP SCHEMA IF EXISTS ${config.DB_SCHEMA} CASCADE`);
      console.log(`  dropped schema ${config.DB_SCHEMA}`);
      await migrate();
      await seed();
      break;
    default:
      throw new Error(`Unknown command "${command}". Use migrate, seed, or reset.`);
  }
}

main()
  .then(() => console.log("[db] done"))
  .catch((err) => {
    console.error(`[db] ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
