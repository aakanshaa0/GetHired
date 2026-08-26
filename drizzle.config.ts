import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Plain `dotenv/config` only reads `.env` — Next.js's `.env.local` convention
// (used by SETUP.md and .env.local.example) needs the path spelled out.
config({ path: ".env.local" });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  // Supabase owns the `auth` schema (including auth.users, which our
  // schema.ts only references for foreign keys) — never generate or push
  // DDL for it.
  schemaFilter: ["public"],
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
