import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { matches, jobs, cvs } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { updateMatchStatus, overrideMatchCv, overrideLegitimacy } from "@/lib/actions";
import CopyButton from "./CopyButton";

const VERDICT_BADGE: Record<string, string> = {
  legit: "✅ Looks legit",
  suspicious: "⚠️ Suspicious — review before applying",
  scam: "🚫 Likely scam",
  unscored: "❔ Not yet scored",
};

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [row] = await db
    .select({ match: matches, job: jobs })
    .from(matches)
    .innerJoin(jobs, eq(matches.jobId, jobs.id))
    .where(and(eq(matches.id, id), eq(matches.userId, user!.id)));

  if (!row) notFound();
  const { match, job } = row;

  if (match.status === "suggested") {
    await db.update(matches).set({ status: "viewed", updatedAt: new Date() }).where(eq(matches.id, match.id));
  }

  const userCvs = await db.select().from(cvs).where(eq(cvs.userId, user!.id));
  const selectedCvId = match.cvIdOverride ?? match.cvId;
  const selectedCv = userCvs.find((c) => c.id === selectedCvId) ?? null;

  let cvDownloadUrl: string | null = null;
  if (selectedCv) {
    const { data } = await supabase.storage.from("cvs").createSignedUrl(selectedCv.storagePath, 60 * 10);
    cvDownloadUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {job.title} — {job.companyName}
        </h1>
        <p className="text-sm text-neutral-500">
          {job.location ?? "Location not stated"}
          {job.isRemote ? " · remote" : ""} · {job.salaryRawText ?? "salary not stated"} · via {job.sourceType}
        </p>
      </div>

      <section className="rounded-md border border-neutral-200 p-4">
        <p className="font-medium">{VERDICT_BADGE[job.legitimacyVerdict]}</p>
        {job.legitimacyReasoning && <p className="mt-1 text-sm text-neutral-600">{job.legitimacyReasoning}</p>}
        {Array.isArray(job.legitimacyFlags) && job.legitimacyFlags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {(job.legitimacyFlags as string[]).map((flag) => (
              <span key={flag} className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">
                {flag.replaceAll("_", " ")}
              </span>
            ))}
          </div>
        )}
        {job.legitimacyUserOverride && (
          <p className="mt-2 text-xs text-neutral-500">
            You marked this as {job.legitimacyUserOverride}
            {job.legitimacyOverrideNote ? `: ${job.legitimacyOverrideNote}` : ""}.
          </p>
        )}
        <div className="mt-3 flex gap-2">
          <form action={overrideLegitimacy.bind(null, job.id, "approved", "")}>
            <button type="submit" className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm">
              Mark legit anyway
            </button>
          </form>
          <form action={overrideLegitimacy.bind(null, job.id, "rejected", "")}>
            <button type="submit" className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm">
              Mark as scam
            </button>
          </form>
        </div>
      </section>

      <section className="rounded-md border border-neutral-200 p-4">
        <h2 className="font-medium">CV</h2>
        <form action={async (formData: FormData) => {
          "use server";
          await overrideMatchCv(match.id, String(formData.get("cvId")));
        }} className="mt-2 flex flex-wrap items-center gap-2">
          <select name="cvId" defaultValue={selectedCvId ?? ""} className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm">
            <option value="" disabled>
              Choose a CV
            </option>
            {userCvs.map((cv) => (
              <option key={cv.id} value={cv.id}>
                {cv.fileName} ({cv.roleTag})
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm">
            Use this CV
          </button>
          {cvDownloadUrl && (
            <a href={cvDownloadUrl} className="text-sm underline" target="_blank" rel="noreferrer">
              Download selected CV
            </a>
          )}
        </form>
        {!selectedCv && <p className="mt-2 text-sm text-amber-700">No CV auto-matched — pick one above.</p>}
      </section>

      <section className="rounded-md border border-neutral-200 p-4">
        <h2 className="font-medium">Referral message</h2>
        {match.referralText ? (
          <>
            <textarea readOnly value={match.referralText} rows={6} className="mt-2 w-full rounded-md border border-neutral-300 p-2 text-sm" />
            <CopyButton text={match.referralText} />
          </>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">
            No default referral template set — add one on the{" "}
            <a href="/dashboard/templates" className="underline">
              Referral templates
            </a>{" "}
            page.
          </p>
        )}
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <a
          href={job.applyUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          Open apply link
        </a>
        <form action={updateMatchStatus.bind(null, match.id, "applied")}>
          <button type="submit" className="rounded-md border border-neutral-300 px-4 py-2 text-sm">
            Mark as applied
          </button>
        </form>
        <form action={updateMatchStatus.bind(null, match.id, "skipped")}>
          <button type="submit" className="rounded-md border border-neutral-300 px-4 py-2 text-sm">
            Skip
          </button>
        </form>
        <span className="text-sm text-neutral-500">Status: {match.status}</span>
      </section>

      {job.descriptionText && (
        <section className="rounded-md border border-neutral-200 p-4">
          <h2 className="font-medium">Original posting</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-600">{job.descriptionText}</p>
        </section>
      )}
    </div>
  );
}
