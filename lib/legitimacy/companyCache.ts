import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { companies } from "../db/schema";

export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\b(pvt\.?|private|ltd\.?|limited|inc\.?|llc|llp)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export async function lookupCompany(name: string) {
  const normalized = normalizeCompanyName(name);
  const [row] = await db
    .select()
    .from(companies)
    .where(eq(companies.normalizedName, normalized))
    .limit(1);
  return row ?? null;
}

/**
 * Records a newly-seen company as 'unknown', or bumps last_seen_at if it
 * already exists. Never auto-creates whitelist/blacklist entries here —
 * only the seed script and explicit LLM promotion (see scoreJob.ts) do that,
 * so a single noisy posting can't silently blacklist a real company.
 */
export async function touchCompany(name: string) {
  const normalized = normalizeCompanyName(name);
  const existing = await lookupCompany(name);
  if (existing) {
    await db.update(companies).set({ lastSeenAt: new Date() }).where(eq(companies.id, existing.id));
    return existing;
  }

  const [created] = await db
    .insert(companies)
    .values({ name, normalizedName: normalized, legitimacyStatus: "unknown", source: "user" })
    .returning();
  return created;
}

/** Promotes a company to whitelisted after a high-confidence 'legit' LLM verdict. */
export async function promoteToWhitelist(name: string) {
  const normalized = normalizeCompanyName(name);
  await db
    .insert(companies)
    .values({ name, normalizedName: normalized, legitimacyStatus: "whitelisted", source: "llm" })
    .onConflictDoUpdate({
      target: companies.normalizedName,
      set: { legitimacyStatus: "whitelisted", lastSeenAt: new Date() },
    });
}
