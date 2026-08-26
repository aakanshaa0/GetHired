import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Used both by scripts/ (GitHub Actions ingestion jobs) and by the Next.js
// app (server components/actions/routes). Lazily connects on first query
// rather than at import time, so simply importing this module (e.g. during
// Next's build-time page-data collection, which has no env vars loaded)
// never throws — only an actual query without DATABASE_URL configured does.
let _db: PostgresJsDatabase<typeof schema> | null = null;

function getDb(): PostgresJsDatabase<typeof schema> {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set. See .env.local.example / SETUP.md.");
    }
    // prepare: false is required when DATABASE_URL points at Supabase's
    // transaction pooler (recommended in SETUP.md for IPv4 compatibility,
    // e.g. from GitHub Actions runners) — pooled connections are reused
    // across backend sessions, so named prepared statements break. Safe to
    // leave on even against a direct connection.
    const client = postgres(connectionString, { max: 1, prepare: false });
    _db = drizzle(client, { schema });
  }
  return _db;
}

export const db: PostgresJsDatabase<typeof schema> = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
