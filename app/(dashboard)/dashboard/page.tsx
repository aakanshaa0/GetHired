import Link from "next/link";
import { eq, and, count } from "drizzle-orm";
import { Inbox, CheckCircle2, FileStack, Rss, ArrowRight } from "lucide-react";
import { db } from "@/lib/db/client";
import { matches, cvs, jobSources, profiles } from "@/lib/db/schema";
import { requireUser } from "@/lib/supabase/server";

export default async function DashboardOverviewPage() {
  const user = await requireUser();
  const userId = user.id;

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId));
  const [suggestedCount] = await db
    .select({ n: count() })
    .from(matches)
    .where(and(eq(matches.userId, userId), eq(matches.status, "suggested")));
  const [appliedCount] = await db
    .select({ n: count() })
    .from(matches)
    .where(and(eq(matches.userId, userId), eq(matches.status, "applied")));
  const userCvs = await db.select().from(cvs).where(eq(cvs.userId, userId));
  const enabledSources = await db.select().from(jobSources).where(eq(jobSources.enabled, true));

  const needsSetup = !profile || userCvs.length === 0 || enabledSources.length === 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Overview</h1>
        <p className="text-sm text-slate-500">
          {profile?.fullName ? `Welcome back, ${profile.fullName}.` : "Welcome to GetHired."}
        </p>
      </div>

      {needsSetup && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Finish setup to start getting matches:</p>
          <ul className="mt-2 list-inside list-disc">
            {!profile && (
              <li>
                <Link href="/dashboard/profile" className="underline">Fill in your profile</Link>
              </li>
            )}
            {userCvs.length === 0 && (
              <li>
                <Link href="/dashboard/cvs" className="underline">Upload at least one CV</Link>
              </li>
            )}
            {enabledSources.length === 0 && (
              <li>
                <Link href="/dashboard/sources" className="underline">Enable a job source</Link>
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Inbox} label="New matches" value={suggestedCount.n} />
        <StatCard icon={CheckCircle2} label="Applied" value={appliedCount.n} />
        <StatCard icon={FileStack} label="CVs on file" value={userCvs.length} />
        <StatCard icon={Rss} label="Active sources" value={enabledSources.length} />
      </div>

      <Link href="/dashboard/matches" className="flex w-fit items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-500">
        View all matches <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div className="card p-4">
      <Icon className="h-5 w-5 text-teal-600" />
      <div className="mt-3 text-2xl font-semibold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );
}
