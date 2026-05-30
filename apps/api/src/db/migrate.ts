import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

// Applies the SQL files in ./migrations in lexical order. Idempotent: each file
// uses IF NOT EXISTS so re-running is safe. Run with: pnpm --filter api db:migrate
async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set — nothing to migrate.");
    process.exit(1);
  }

  const here = dirname(fileURLToPath(import.meta.url));
  const dir = join(here, "migrations");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const ssl =
    /sslmode=require/.test(connectionString) ||
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined;
  const pool = new Pool({ connectionString, ssl });

  try {
    for (const file of files) {
      const sql = readFileSync(join(dir, file), "utf8");
      process.stdout.write(`Applying ${file}... `);
      await pool.query(sql);
      console.log("done");
    }
    console.log(`Migrations complete (${files.length} file(s)).`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
