import { config } from "dotenv";
config({ path: ".env.local" });
import { eq, and, notInArray } from "drizzle-orm";
import { db } from "../lib/db/client";
import { jobs, matches, cvs, profiles, referralTemplates, notifications, pushSubscriptions } from "../lib/db/schema";
import { evaluateSalary } from "../lib/matching/salaryFilter";
import { pickBestCv } from "../lib/matching/cvMatcher";
import { buildApplicationPackage } from "../lib/matching/buildApplicationPackage";
import { sendPushNotification } from "../lib/notifications/push";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Web push carries only title/company + a deep link — rich content (CV
 * pick, referral text, legitimacy reasoning) stays in-app. This is the only
 * *instant* notification channel; email is deliberately a once-daily digest
 * instead (see scripts/send-daily-digest.ts) — this script only creates the
 * matches it covers, never sends email itself.
 */
async function notifyPushSubscribers(userId: string, job: { title: string; companyName: string }, matchUrl: string) {
  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  if (subs.length === 0) return null;

  const results = await Promise.all(
    subs.map(async (sub) => {
      const result = await sendPushNotification(sub, {
        title: `${job.title} at ${job.companyName}`,
        body: "New match — tap to view",
        url: matchUrl,
      });
      if (!result.ok && result.expired) {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
      }
      return result;
    })
  );

  return results.some((r) => r.ok) ? "sent" : "failed";
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

    let createdCount = 0;

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
      createdCount++;

      if (salaryResult === "above_threshold") {
        const matchUrl = `${APP_URL}/dashboard/matches/${match.id}`;
        const pushStatus = await notifyPushSubscribers(profile.id, job, matchUrl);
        if (pushStatus) {
          await db.insert(notifications).values({
            matchId: match.id,
            channel: "web_push",
            status: pushStatus,
            sentAt: pushStatus === "sent" ? new Date() : undefined,
            payload: { instant: true },
          });
        }
      }
    }

    console.log(`[user ${profile.id}] created ${createdCount} new match(es) from ${candidateJobs.length} candidate job(s).`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
