import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

// Neon's pool driver needs a WebSocket for multi-statement transactions
// (claims and pickup transitions). Node has no global WebSocket before v22.
neonConfig.webSocketConstructor = ws;

export type Db = ReturnType<typeof drizzle>;

let client: Db | undefined;

/** True when DATABASE_URL is set. Safe to call without throwing. */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Returns the shared Drizzle client, creating it on first use.
 * Throws only when called without DATABASE_URL, never at import time.
 */
export function getDb(): Db {
  if (!client) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set. Add it to the environment before using the database.");
    }
    client = drizzle(new Pool({ connectionString }));
  }
  return client;
}
