import { eq } from "drizzle-orm";
import { Bell } from "lucide-react";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { requireUser } from "@/lib/supabase/server";
import { updateSalaryThreshold } from "@/lib/actions";

export default async function SettingsPage() {
  const user = await requireUser();

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id));

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>

      <form action={updateSalaryThreshold} className="card flex flex-col gap-2 p-6">
        <label className="label" htmlFor="minSalaryLpa">
          Minimum salary (LPA)
        </label>
        <input
          id="minSalaryLpa"
          name="minSalaryLpa"
          type="number"
          step="0.5"
          min="0"
          defaultValue={profile?.minSalaryLpa ?? 8}
          className="input w-40"
        />
        <p className="text-xs text-slate-500">
          Jobs stating a salary below this are never matched. Jobs with no stated salary are still matched but
          sent as a daily digest instead of instantly.
        </p>
        <button type="submit" className="btn-primary mt-2 w-fit">
          Save
        </button>
      </form>

      <div className="card p-6">
        <h2 className="flex items-center gap-2 font-medium text-slate-900">
          <Bell className="h-4 w-4 text-slate-400" />
          Push notifications
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Not yet available — Phase 1 ships email notifications only. See SETUP.md for the Phase 2 plan.
        </p>
      </div>
    </div>
  );
}
