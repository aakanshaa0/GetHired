import { eq, and, count } from "drizzle-orm";
import { signOut } from "@/lib/actions";
import { db } from "@/lib/db/client";
import { matches } from "@/lib/db/schema";
import { requireUser } from "@/lib/supabase/server";
import Sidebar from "@/components/dashboard/Sidebar";

// Every dashboard page reads live, per-user DB/auth state — never statically
// prerender any of them. Setting this on the shared layout applies it to all
// nested pages (jobSources/matches/etc. have no per-request signal of their
// own, like a cookies() call, that would make Next infer this automatically).
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [newMatches] = await db
    .select({ n: count() })
    .from(matches)
    .where(and(eq(matches.userId, user.id), eq(matches.status, "suggested")));

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="border-b border-slate-200 bg-white sm:fixed sm:inset-y-0 sm:left-0 sm:w-60 sm:border-b-0 sm:border-r">
        <Sidebar onSignOut={signOut} newMatchCount={newMatches.n} />
      </aside>
      <div className="sm:pl-60">
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
