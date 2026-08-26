import { config } from "dotenv";
config({ path: ".env.local" });
import { eq, and, notInArray } from "drizzle-orm";
import { db } from "../lib/db/client";
import { jobs, matches, cvs, profiles, referralTemplates, notifications } from "../lib/db/schema";
import { evaluateSalary } from "../lib/matching/salaryFilter";
import { pickBestCv } from "../lib/matching/cvMatcher";
import { buildApplicationPackage } from "../lib/matching/buildApplicationPackage";
import { sendMatchEmail, sendDigestEmail } from "../lib/notifications/email";
import { createAdminClient } from "../lib/supabase/admin";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function getUserEmail(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data?.user?.email) return null;
  return data.user.email;
}

async function main() {
  const allProfiles = await db.select().from(profiles);
  if (allProfiles.length === 0) {
    console.log("No user profiles yet.");
    return;
  }

  const eligibleJobs = await db
    .select()
    .from(jobs)
    .where(notInArray(jobs.legitimacyVerdict, ["unscored", "scam"]));

  for (const profile of allProfiles) {
    const existingMatches = await db
      .select({ jobId: matches.jobId })
      .from(matches)
      .where(eq(matches.userId, profile.id));
    const alreadyMatched = new Set(existingMatches.map((m) => m.jobId));

    const candidateJobs = eligibleJobs.filter((j) => !alreadyMatched.has(j.id));
    if (candidateJobs.length === 0) continue;

    const userCvs = await db.select().from(cvs).where(eq(cvs.userId, profile.id));
    const [template] = await db
      .select()
      .from(referralTemplates)
      .where(and(eq(referralTemplates.userId, profile.id), eq(referralTemplates.isDefault, true)));

    const email = await getUserEmail(profile.id);
    const digestItems: Array<{
      job: (typeof candidateJobs)[number];
      pkg: ReturnType<typeof buildApplicationPackage>;
      matchUrl: string;
      notificationId: string;
    }> = [];

    for (const job of candidateJobs) {
      const salaryResult = evaluateSalary(job, profile.minSalaryLpa);
      if (salaryResult === "below_threshold") continue;

      const cvMatch = pickBestCv({ title: job.title, descriptionText: job.descriptionText }, userCvs);
      const chosenCv = userCvs.find((c) => c.id === cvMatch.cvId) ?? null;

      const pkg = buildApplicationPackage({ job, profile, cv: chosenCv, template: template ?? null });

      const [match] = await db
        .insert(matches)
        .values({
          jobId: job.id,
          userId: profile.id,
          matchScore: cvMatch.score,
          matchReason: { matchedKeywords: cvMatch.matchedKeywords },
          cvId: cvMatch.cvId,
          referralText: pkg.referralText,
          salaryBucket: salaryResult === "above_threshold" ? "above_threshold" : "unknown",
          status: "suggested",
        })
        .returning();

      const matchUrl = `${APP_URL}/dashboard/matches/${match.id}`;

      if (!email) {
        console.warn(`No email on file for user ${profile.id}; skipping notification for match ${match.id}`);
        continue;
      }

      if (salaryResult === "above_threshold") {
        const [notif] = await db
          .insert(notifications)
          .values({ matchId: match.id, channel: "email", payload: { instant: true } })
          .returning();
        try {
          await sendMatchEmail({ to: email, job, pkg, matchUrl });
          await db
            .update(notifications)
            .set({ status: "sent", sentAt: new Date() })
            .where(eq(notifications.id, notif.id));
        } catch (err) {
          await db
            .update(notifications)
            .set({ status: "failed", error: err instanceof Error ? err.message : String(err) })
            .where(eq(notifications.id, notif.id));
        }
      } else {
        const [notif] = await db
          .insert(notifications)
          .values({ matchId: match.id, channel: "email", payload: { instant: false, digest: true } })
          .returning();
        digestItems.push({ job, pkg, matchUrl, notificationId: notif.id });
      }
    }

    if (digestItems.length > 0 && email) {
      try {
        await sendDigestEmail({ to: email, items: digestItems });
        await Promise.all(
          digestItems.map(({ notificationId }) =>
            db
              .update(notifications)
              .set({ status: "sent", sentAt: new Date() })
              .where(eq(notifications.id, notificationId))
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await Promise.all(
          digestItems.map(({ notificationId }) =>
            db.update(notifications).set({ status: "failed", error: message }).where(eq(notifications.id, notificationId))
          )
        );
        console.error("Digest email failed:", err);
      }
    }

    console.log(`[user ${profile.id}] processed ${candidateJobs.length} candidate job(s), ${digestItems.length} in digest.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
