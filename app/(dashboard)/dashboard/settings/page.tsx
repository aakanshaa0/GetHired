import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { updateSalaryThreshold } from "@/lib/actions";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, user!.id));

  return (
    <div className="flex max-w-lg flex-col gap-8">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <form action={updateSalaryThreshold} className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="minSalaryLpa">
          Minimum salary (LPA)
        </label>
        <input
          id="minSalaryLpa"
          name="minSalaryLpa"
          type="number"
          step="0.5"
          min="0"
          defaultValue={profile?.minSalaryLpa ?? 8}
          className="w-40 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <p className="text-xs text-neutral-500">
          Jobs stating a salary below this are never matched. Jobs with no stated salary are still matched but
          sent as a daily digest instead of instantly.
        </p>
        <button type="submit" className="mt-2 w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
          Save
        </button>
      </form>

      <div className="rounded-md border border-neutral-200 p-4">
        <h2 className="font-medium">Push notifications</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Not yet available — Phase 1 ships email notifications only. See SETUP.md for the Phase 2 plan.
        </p>
      </div>
    </div>
  );
}
