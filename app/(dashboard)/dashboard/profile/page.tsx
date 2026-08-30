import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { requireUser } from "@/lib/supabase/server";
import { updateProfileDetails } from "@/lib/actions";

export default async function ProfilePage() {
  const user = await requireUser();

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id));

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Full name and college are used directly in your referral messages. Everything else is optional — fill
          in whatever&apos;s relevant and leave the rest blank.
        </p>
      </div>

      <form action={updateProfileDetails} className="flex flex-col gap-6">
        <Section title="Basics">
          <Field label="Full name" name="fullName" required defaultValue={profile?.fullName ?? ""} />
          <Field label="College" name="college" required defaultValue={profile?.college ?? ""} />
          <Field
            label="Years of experience"
            name="yearsExperience"
            type="number"
            step="0.5"
            optional
            defaultValue={profile?.yearsExperience?.toString() ?? ""}
            hint="Leave at 0 if you're a student with internships only."
          />
          <TextField
            label="Target roles"
            name="targetRoles"
            optional
            defaultValue={profile?.targetRoles?.join(", ") ?? ""}
            placeholder="backend engineer, data analyst"
            hint="Comma-separated. Used as a fallback when a CV has no keywords set."
          />
        </Section>

        <Section title="Skills & links">
          <TextField
            label="Skills"
            name="skills"
            optional
            defaultValue={profile?.skills?.join(", ") ?? ""}
            placeholder="react, nextjs, node, sql, aws"
            hint="Comma-separated. Available in referral templates as {{skills}}."
          />
          <Field label="GitHub URL" name="githubUrl" optional defaultValue={profile?.githubUrl ?? ""} placeholder="https://github.com/yourhandle" />
          <Field label="LinkedIn URL" name="linkedinUrl" optional defaultValue={profile?.linkedinUrl ?? ""} placeholder="https://linkedin.com/in/yourhandle" />
          <Field label="LeetCode URL" name="leetcodeUrl" optional defaultValue={profile?.leetcodeUrl ?? ""} placeholder="https://leetcode.com/u/yourhandle" />
          <Field
            label="Portfolio / other link"
            name="portfolioUrl"
            optional
            defaultValue={profile?.portfolioUrl ?? ""}
            placeholder="https://yourportfolio.dev"
          />
        </Section>

        <Section title="Experience & achievements">
          <TextArea
            label="Experience & projects"
            name="experienceSummary"
            optional
            defaultValue={profile?.experienceSummary ?? ""}
            placeholder="Internships, notable projects — a short paragraph is enough."
            hint="Available in referral templates as {{experience_summary}}."
          />
          <TextArea
            label="Achievements, certifications & patents"
            name="achievementsSummary"
            optional
            defaultValue={profile?.achievementsSummary ?? ""}
            placeholder="Hackathon wins, certifications, patents, publications..."
            hint="Available in referral templates as {{achievements_summary}}."
          />
        </Section>

        <button type="submit" className="btn-primary w-fit">
          Save
        </button>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card flex flex-col gap-4 p-6">
      <h2 className="font-medium text-slate-900">{title}</h2>
      {children}
    </div>
  );
}

function FieldLabel({ label, name, required, optional }: { label: string; name: string; required?: boolean; optional?: boolean }) {
  return (
    <label className="label" htmlFor={name}>
      {label}
      {required && <span className="ml-1 text-rose-500">*</span>}
      {optional && <span className="ml-1 font-normal text-slate-400">(optional)</span>}
    </label>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  step,
  placeholder,
  required,
  optional,
  hint,
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
  step?: string;
  placeholder?: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel label={label} name={name} required={required} optional={optional} />
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="input"
      />
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function TextField(props: Omit<Parameters<typeof Field>[0], "type">) {
  return <Field {...props} type="text" />;
}

function TextArea({
  label,
  name,
  defaultValue,
  placeholder,
  optional,
  hint,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  optional?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel label={label} name={name} optional={optional} />
      <textarea id={name} name={name} rows={4} placeholder={placeholder} defaultValue={defaultValue} className="input" />
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
