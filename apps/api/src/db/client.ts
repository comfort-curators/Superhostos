import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;

let pool: Pool | null = null;
let db: Database | null = null;

/** Persistence is active only when a DATABASE_URL is configured. */
export function isDbEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Returns the shared Drizzle client, or null when no DATABASE_URL is set — in
 * which case repositories fall back to in-memory stores (dev, tests, demos).
 */
export function getDb(): Database | null {
  if (!isDbEnabled()) return null;
  if (!db) {
    const connectionString = process.env.DATABASE_URL as string;
    // Managed Postgres (e.g. DigitalOcean) terminates TLS with its own chain.
    const ssl = /sslmode=require/.test(connectionString) || process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : undefined;
    pool = new Pool({ connectionString, ssl, max: 10, idleTimeoutMillis: 30_000 });
    db = drizzle(pool, { schema });
  }
  return db;
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}
