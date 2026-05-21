import { Pool, PoolClient } from "postgres";

let pool: Pool | null = null;

export interface DatabaseConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean;
}

export async function initializeDatabase(config?: DatabaseConfig): Promise<void> {
  try {
    const connectionString =
      config?.connectionString || process.env.DATABASE_URL;

    if (!connectionString) {
      console.warn(
        "DATABASE_URL not set. Database connection will not be initialized."
      );
      return;
    }

    pool = new Pool({
      connectionString,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    const client = await pool.connect();
    await client.query("SELECT NOW()");
    client.release();

    console.log("✓ Database connected successfully");
  } catch (error) {
    console.error("✗ Database connection failed:", error);
    throw error;
  }
}

export async function getDatabase(): Promise<PoolClient> {
  if (!pool) {
    await initializeDatabase();
  }

  if (!pool) {
    throw new Error("Database pool not initialized");
  }

  return pool.connect();
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log("✓ Database connection closed");
  }
}

export function isDatabaseConnected(): boolean {
  return pool !== null;
}
