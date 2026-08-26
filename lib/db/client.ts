import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Used by scripts/ (GitHub Actions ingestion jobs) which need a direct Postgres
// connection — Supabase's pooled connection string works fine here too, but
// scripts run infrequently and briefly so a direct connection avoids pool churn.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. See .env.local.example / SETUP.md.");
}

const client = postgres(connectionString, { max: 1 });
export const db = drizzle(client, { schema });
