import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

export let db: NodePgDatabase<typeof schema> | undefined;
export let pool: Pool | undefined;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20, // Maximum number of connections in the pool
    min: 2,  // Minimum number of connections to maintain
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 10000, // Wait 10 seconds for connection
    allowExitOnIdle: true, // Allow process to exit when all connections are idle
  });

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Database pool error:', err);
  });

  // Handle connection errors
  pool.on('connect', (client) => {
    console.log('Database connection established');
  });

  db = drizzle(pool, { schema });
}

