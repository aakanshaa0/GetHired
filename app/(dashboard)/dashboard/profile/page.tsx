import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { updateProfileDetails } from "@/lib/actions";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, user!.id));

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
      <form action={updateProfileDetails} className="card flex flex-col gap-4 p-6">
        <Field label="Full name" name="fullName" defaultValue={profile?.fullName ?? ""} />
        <Field label="College" name="college" defaultValue={profile?.college ?? ""} />
        <Field
          label="Years of experience"
          name="yearsExperience"
          type="number"
          step="0.5"
          defaultValue={profile?.yearsExperience?.toString() ?? ""}
        />
        <div className="flex flex-col gap-1">
          <label className="label" htmlFor="targetRoles">
            Target roles
          </label>
          <input
            id="targetRoles"
            name="targetRoles"
            defaultValue={profile?.targetRoles?.join(", ") ?? ""}
            placeholder="backend engineer, data analyst"
            className="input"
          />
          <p className="text-xs text-slate-500">Comma-separated. Used as a fallback when a CV has no keywords set.</p>
        </div>
        <button type="submit" className="btn-primary w-fit">
          Save
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  step,
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
  step?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input id={name} name={name} type={type} step={step} defaultValue={defaultValue} className="input" />
    </div>
  );
}
