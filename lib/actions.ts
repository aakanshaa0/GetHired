"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "./db/client";
import { profiles, cvs, referralTemplates, jobSources, matches, jobs } from "./db/schema";
import { createClient } from "./supabase/server";

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

async function ensureProfile(userId: string) {
  await db.insert(profiles).values({ id: userId }).onConflictDoNothing();
}

export async function updateProfileDetails(formData: FormData) {
  const userId = await requireUserId();
  await ensureProfile(userId);

  const fullName = String(formData.get("fullName") ?? "").trim() || null;
  const college = String(formData.get("college") ?? "").trim() || null;
  const yearsExperienceRaw = formData.get("yearsExperience");
  const yearsExperience = yearsExperienceRaw ? Number(yearsExperienceRaw) : null;
  const targetRoles = String(formData.get("targetRoles") ?? "")
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);

  await db
    .update(profiles)
    .set({ fullName, college, yearsExperience, targetRoles, updatedAt: new Date() })
    .where(eq(profiles.id, userId));

  revalidatePath("/dashboard/profile");
}

export async function updateSalaryThreshold(formData: FormData) {
  const userId = await requireUserId();
  await ensureProfile(userId);
  const minSalaryLpa = Number(formData.get("minSalaryLpa") ?? 8);

  await db.update(profiles).set({ minSalaryLpa, updatedAt: new Date() }).where(eq(profiles.id, userId));
  revalidatePath("/dashboard/settings");
}

export async function deleteCv(cvId: string) {
  const userId = await requireUserId();
  await db.delete(cvs).where(and(eq(cvs.id, cvId), eq(cvs.userId, userId)));
  revalidatePath("/dashboard/cvs");
}

export async function setDefaultCv(cvId: string) {
  const userId = await requireUserId();
  await db.update(cvs).set({ isDefault: false }).where(eq(cvs.userId, userId));
  await db.update(cvs).set({ isDefault: true }).where(and(eq(cvs.id, cvId), eq(cvs.userId, userId)));
  revalidatePath("/dashboard/cvs");
}

export async function createReferralTemplate(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!name || !body) throw new Error("Template name and body are required");

  const existing = await db.select().from(referralTemplates).where(eq(referralTemplates.userId, userId));

  await db.insert(referralTemplates).values({
    userId,
    name,
    body,
    isDefault: existing.length === 0,
  });

  revalidatePath("/dashboard/templates");
}

export async function deleteReferralTemplate(id: string) {
  const userId = await requireUserId();
  await db.delete(referralTemplates).where(and(eq(referralTemplates.id, id), eq(referralTemplates.userId, userId)));
  revalidatePath("/dashboard/templates");
}

export async function setDefaultTemplate(id: string) {
  const userId = await requireUserId();
  await db.update(referralTemplates).set({ isDefault: false }).where(eq(referralTemplates.userId, userId));
  await db
    .update(referralTemplates)
    .set({ isDefault: true })
    .where(and(eq(referralTemplates.id, id), eq(referralTemplates.userId, userId)));
  revalidatePath("/dashboard/templates");
}

export async function createJobSource(formData: FormData) {
  await requireUserId();
  const type = String(formData.get("type") ?? "") as (typeof jobSources.$inferInsert)["type"];
  const name = String(formData.get("name") ?? "").trim();
  const configRaw = String(formData.get("config") ?? "{}");

  let config: Record<string, unknown>;
  try {
    config = JSON.parse(configRaw);
  } catch {
    throw new Error("Config must be valid JSON");
  }

  await db.insert(jobSources).values({ type, name, config });
  revalidatePath("/dashboard/sources");
}

export async function toggleJobSource(id: string, enabled: boolean) {
  await requireUserId();
  await db.update(jobSources).set({ enabled, consecutiveFailures: 0 }).where(eq(jobSources.id, id));
  revalidatePath("/dashboard/sources");
}

export async function deleteJobSource(id: string) {
  await requireUserId();
  await db.delete(jobSources).where(eq(jobSources.id, id));
  revalidatePath("/dashboard/sources");
}

export async function updateMatchStatus(matchId: string, status: (typeof matches.$inferInsert)["status"]) {
  const userId = await requireUserId();
  const patch: Partial<typeof matches.$inferInsert> = { status, updatedAt: new Date() };
  if (status === "applied") patch.appliedAt = new Date();
  if (status === "skipped") patch.skippedAt = new Date();

  await db.update(matches).set(patch).where(and(eq(matches.id, matchId), eq(matches.userId, userId)));
  revalidatePath(`/dashboard/matches/${matchId}`);
  revalidatePath("/dashboard/matches");
}

export async function overrideMatchCv(matchId: string, cvId: string) {
  const userId = await requireUserId();
  await db
    .update(matches)
    .set({ cvIdOverride: cvId, updatedAt: new Date() })
    .where(and(eq(matches.id, matchId), eq(matches.userId, userId)));
  revalidatePath(`/dashboard/matches/${matchId}`);
}

export async function overrideLegitimacy(jobId: string, decision: "approved" | "rejected", note: string) {
  await requireUserId();
  await db
    .update(jobs)
    .set({
      legitimacyUserOverride: decision,
      legitimacyOverrideNote: note || null,
      legitimacyOverriddenAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, jobId));
  revalidatePath("/dashboard/matches");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
