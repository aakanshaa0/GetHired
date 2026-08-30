import { config } from "dotenv";
config({ path: ".env.local" });
import { eq, and, notInArray } from "drizzle-orm";
import { db } from "../lib/db/client";
import { matches, jobs, cvs, profiles, referralTemplates, notifications } from "../lib/db/schema";
import { buildApplicationPackage } from "../lib/matching/buildApplicationPackage";
import { sendDailyDigestEmail } from "../lib/notifications/email";
import { createAdminClient } from "../lib/supabase/admin";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function getUserEmail(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data?.user?.email) return null;
  return data.user.email;
}

/**
 * Runs once a day (separate cron from the every-3-hours ingest/match
 * pipeline — see .github/workflows). Sends exactly one email per user
 * covering every match that doesn't already have an email notification row,
 * regardless of salary bucket — "today's jobs" is a single summary, not a
 * stream. Real-time awareness is web push + the sidebar bell, not email.
 */
async function main() {
  const allProfiles = await db.select().from(profiles);

  const alreadyEmailed = await db
    .select({ matchId: notifications.matchId })
    .from(notifications)
    .where(eq(notifications.channel, "email"));
  const emailedIds = new Set(alreadyEmailed.map((n) => n.matchId));

  for (const profile of allProfiles) {
    const pending = await db
      .select({ match: matches, job: jobs })
      .from(matches)
      .innerJoin(jobs, eq(matches.jobId, jobs.id))
      .where(and(eq(matches.userId, profile.id), notInArray(matches.status, ["skipped", "expired"])));

    const toSend = pending.filter((p) => !emailedIds.has(p.match.id));
    if (toSend.length === 0) {
      console.log(`[user ${profile.id}] nothing new since last digest.`);
      continue;
    }

    const email = await getUserEmail(profile.id);
    if (!email) {
      console.warn(`[user ${profile.id}] no email on file, skipping digest.`);
      continue;
    }

    const userCvs = await db.select().from(cvs).where(eq(cvs.userId, profile.id));
    const [template] = await db
      .select()
      .from(referralTemplates)
      .where(and(eq(referralTemplates.userId, profile.id), eq(referralTemplates.isDefault, true)));

    const items = toSend.map(({ match, job }) => {
      const cv = userCvs.find((c) => c.id === (match.cvIdOverride ?? match.cvId)) ?? null;
      const pkg = buildApplicationPackage({ job, profile, cv, template: template ?? null });
      return { job, pkg, matchUrl: `${APP_URL}/dashboard/matches/${match.id}`, matchId: match.id };
    });

    try {
      await sendDailyDigestEmail({ to: email, items });
      await db.insert(notifications).values(
        items.map((item) => ({
          matchId: item.matchId,
          channel: "email" as const,
          status: "sent" as const,
          sentAt: new Date(),
          payload: { digest: true },
        }))
      );
      console.log(`[user ${profile.id}] sent digest with ${items.length} job(s).`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await db.insert(notifications).values(
        items.map((item) => ({
          matchId: item.matchId,
          channel: "email" as const,
          status: "failed" as const,
          error: message,
          payload: { digest: true },
        }))
      );
      console.error(`[user ${profile.id}] digest send failed:`, err);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
