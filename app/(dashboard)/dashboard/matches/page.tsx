import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { MapPin, IndianRupee, Inbox } from "lucide-react";
import { db } from "@/lib/db/client";
import { matches, jobs } from "@/lib/db/schema";
import { requireUser } from "@/lib/supabase/server";
import { LegitimacyBadge, StatusBadge } from "@/components/badges";

export default async function MatchesPage() {
  const user = await requireUser();

  const rows = await db
    .select({ match: matches, job: jobs })
    .from(matches)
    .innerJoin(jobs, eq(matches.jobId, jobs.id))
    .where(eq(matches.userId, user.id))
    .orderBy(desc(matches.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Matches</h1>

      {rows.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-12 text-center">
          <Inbox className="h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-500">
            No matches yet. Once a job source is enabled and the pipeline runs, matches show up here.
          </p>
        </div>
      ) : (
        <ul className="card flex flex-col divide-y divide-slate-200">
          {rows.map(({ match, job }) => (
            <li key={match.id}>
              <Link
                href={`/dashboard/matches/${match.id}`}
                className="flex flex-col gap-2 p-4 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="flex items-center gap-2 font-medium text-slate-900">
                    {match.status === "suggested" && (
                      <span
                        aria-label="Unseen"
                        className="h-2 w-2 shrink-0 rounded-full bg-rose-500"
                      />
                    )}
                    {job.title} <span className="text-slate-400">·</span> {job.companyName}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.location ?? "Not stated"}
                      {job.isRemote ? " · remote" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <IndianRupee className="h-3.5 w-3.5" />
                      {job.salaryRawText ?? "Not stated"}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <LegitimacyBadge verdict={job.legitimacyVerdict} />
                  <StatusBadge status={match.status} />
                  {match.salaryBucket === "unknown" && <span className="badge-neutral">salary unknown</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
