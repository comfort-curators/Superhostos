import { Pool, type PoolClient } from "pg";

let pool: Pool | null = null;

export interface DatabaseConfig {
  connectionString?: string;
}

export async function initializeDatabase(
  config?: DatabaseConfig,
): Promise<void> {
  const connectionString = config?.connectionString ?? process.env.DATABASE_URL;
  if (!connectionString) return;
  pool = new Pool({
    connectionString,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  const client = await pool.connect();
  await client.query("SELECT NOW()");
  client.release();
}

export async function getDatabase(): Promise<PoolClient> {
  if (!pool) await initializeDatabase();
  if (!pool) throw new Error("Database pool not initialized");
  return pool.connect();
}

export async function closeDatabase(): Promise<void> {
  if (!pool) return;
  await pool.end();
  pool = null;
}

export function isDatabaseConnected(): boolean {
  return pool !== null;
}
