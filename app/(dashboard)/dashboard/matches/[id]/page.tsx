import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { MapPin, IndianRupee, ExternalLink, Download, ShieldCheck, FileStack } from "lucide-react";
import { db } from "@/lib/db/client";
import { matches, jobs, cvs } from "@/lib/db/schema";
import { createClient, requireUser } from "@/lib/supabase/server";
import { updateMatchStatus, overrideMatchCv, overrideLegitimacy } from "@/lib/actions";
import { LegitimacyBadge } from "@/components/badges";
import CopyButton from "./CopyButton";

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const [row] = await db
    .select({ match: matches, job: jobs })
    .from(matches)
    .innerJoin(jobs, eq(matches.jobId, jobs.id))
    .where(and(eq(matches.id, id), eq(matches.userId, user.id)));

  if (!row) notFound();
  const { match, job } = row;

  if (match.status === "suggested") {
    await db.update(matches).set({ status: "viewed", updatedAt: new Date() }).where(eq(matches.id, match.id));
  }

  const userCvs = await db.select().from(cvs).where(eq(cvs.userId, user.id));
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
        <h1 className="text-2xl font-semibold text-slate-900">
          {job.title} <span className="text-slate-400">·</span> {job.companyName}
        </h1>
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
          <span className="badge-neutral">via {job.sourceType}</span>
        </p>
      </div>

      <section className="card p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-slate-400" />
          <LegitimacyBadge verdict={job.legitimacyVerdict} />
        </div>
        {job.legitimacyReasoning && <p className="mt-2 text-sm text-slate-600">{job.legitimacyReasoning}</p>}
        {Array.isArray(job.legitimacyFlags) && job.legitimacyFlags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(job.legitimacyFlags as string[]).map((flag) => (
              <span key={flag} className="badge-neutral">
                {flag.replaceAll("_", " ")}
              </span>
            ))}
          </div>
        )}
        {job.legitimacyUserOverride && (
          <p className="mt-3 text-xs text-slate-500">
            You marked this as {job.legitimacyUserOverride}
            {job.legitimacyOverrideNote ? `: ${job.legitimacyOverrideNote}` : ""}.
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <form action={overrideLegitimacy.bind(null, job.id, "approved", "")}>
            <button type="submit" className="btn-secondary text-xs">
              Mark legit anyway
            </button>
          </form>
          <form action={overrideLegitimacy.bind(null, job.id, "rejected", "")}>
            <button type="submit" className="btn-secondary text-xs">
              Mark as scam
            </button>
          </form>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-medium text-slate-900">
          <FileStack className="h-4 w-4 text-slate-400" />
          CV
        </h2>
        <form
          action={async (formData: FormData) => {
            "use server";
            await overrideMatchCv(match.id, String(formData.get("cvId")));
          }}
          className="mt-3 flex flex-wrap items-center gap-2"
        >
          <select name="cvId" defaultValue={selectedCvId ?? ""} className="input">
            <option value="" disabled>
              Choose a CV
            </option>
            {userCvs.map((cv) => (
              <option key={cv.id} value={cv.id}>
                {cv.fileName} ({cv.roleTag})
              </option>
            ))}
          </select>
          <button type="submit" className="btn-secondary">
            Use this CV
          </button>
          {cvDownloadUrl && (
            <a href={cvDownloadUrl} className="flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-500" target="_blank" rel="noreferrer">
              <Download className="h-4 w-4" />
              Download
            </a>
          )}
        </form>
        {!selectedCv && <p className="mt-2 text-sm text-amber-700">No CV auto-matched — pick one above.</p>}
      </section>

      <section className="card p-5">
        <h2 className="font-medium text-slate-900">Referral message</h2>
        {match.referralText ? (
          <>
            <textarea readOnly value={match.referralText} rows={6} className="input mt-3 w-full" />
            <CopyButton text={match.referralText} />
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            No default referral template set — add one on the{" "}
            <a href="/dashboard/templates" className="font-medium text-teal-600 hover:text-teal-500">
              Referral templates
            </a>{" "}
            page.
          </p>
        )}
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <a href={job.applyUrl} target="_blank" rel="noreferrer" className="btn-primary">
          Open apply link <ExternalLink className="h-4 w-4" />
        </a>
        <form action={updateMatchStatus.bind(null, match.id, "applied")}>
          <button type="submit" className="btn-secondary">
            Mark as applied
          </button>
        </form>
        <form action={updateMatchStatus.bind(null, match.id, "skipped")}>
          <button type="submit" className="btn-danger">
            Skip
          </button>
        </form>
        <span className="text-sm text-slate-500">Status: {match.status}</span>
      </section>

      {job.descriptionText && (
        <section className="card p-5">
          <h2 className="font-medium text-slate-900">Original posting</h2>
          <p className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap text-sm text-slate-600">{job.descriptionText}</p>
        </section>
      )}
    </div>
  );
}
