import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { matches, jobs } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = {
  suggested: "New",
  viewed: "Viewed",
  ready: "Ready to apply",
  applied: "Applied",
  skipped: "Skipped",
  expired: "Expired",
};

const VERDICT_BADGE: Record<string, string> = {
  legit: "✅ Legit",
  suspicious: "⚠️ Suspicious",
  scam: "🚫 Scam",
  unscored: "❔ Scoring...",
};

export default async function MatchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rows = await db
    .select({ match: matches, job: jobs })
    .from(matches)
    .innerJoin(jobs, eq(matches.jobId, jobs.id))
    .where(eq(matches.userId, user!.id))
    .orderBy(desc(matches.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Matches</h1>

      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No matches yet. Once a job source is enabled and the pipeline runs, matches show up here.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-200 rounded-md border border-neutral-200">
          {rows.map(({ match, job }) => (
            <li key={match.id}>
              <Link href={`/dashboard/matches/${match.id}`} className="flex flex-col gap-1 p-4 hover:bg-neutral-50 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">
                    {job.title} — {job.companyName}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {job.location ?? "Location not stated"}
                    {job.isRemote ? " · remote" : ""} · {job.salaryRawText ?? "salary not stated"}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>{VERDICT_BADGE[job.legitimacyVerdict]}</span>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5">
                    {STATUS_LABEL[match.status]}
                  </span>
                  {match.salaryBucket === "unknown" && (
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5">salary unknown</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
