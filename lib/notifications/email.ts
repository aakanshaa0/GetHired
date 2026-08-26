import { Resend } from "resend";
import type { ApplicationPackage } from "../matching/buildApplicationPackage";

type Job = {
  title: string;
  companyName: string;
  location: string | null;
  isRemote: boolean;
  salaryRawText: string | null;
  salaryConfidence: string;
};

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set. See .env.local.example / SETUP.md.");
  return new Resend(apiKey);
}

function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? "GetHired <onboarding@resend.dev>";
}

function legitimacyBadge(verdict: string): string {
  if (verdict === "legit") return "✅ Looks legit";
  if (verdict === "suspicious") return "⚠️ Suspicious — review before applying";
  if (verdict === "scam") return "🚫 Likely scam";
  return "❔ Not yet scored";
}

function renderMatchHtml(job: Job, pkg: ApplicationPackage, matchUrl: string): string {
  return `
    <h2>${job.title} — ${job.companyName}</h2>
    <p>${job.location ?? "Location not stated"}${job.isRemote ? " (remote)" : ""}</p>
    <p>Salary: ${job.salaryRawText ?? "not stated"}</p>
    <p><strong>${legitimacyBadge(pkg.legitimacySummary.verdict)}</strong></p>
    ${pkg.legitimacySummary.reasoning ? `<p><em>${pkg.legitimacySummary.reasoning}</em></p>` : ""}
    ${pkg.cv ? `<p>Suggested CV: ${pkg.cv.fileName} (${pkg.cv.roleTag})</p>` : "<p>No matching CV found — pick one manually.</p>"}
    ${pkg.referralText ? `<p><strong>Referral message:</strong></p><pre>${pkg.referralText}</pre>` : ""}
    <p><a href="${matchUrl}">Open in GetHired</a> · <a href="${pkg.applyUrl}">Apply link</a></p>
  `;
}

export async function sendMatchEmail(params: {
  to: string;
  job: Job;
  pkg: ApplicationPackage;
  matchUrl: string;
}) {
  const resend = getResend();
  await resend.emails.send({
    from: fromAddress(),
    to: params.to,
    subject: `New match: ${params.job.title} at ${params.job.companyName}`,
    html: renderMatchHtml(params.job, params.pkg, params.matchUrl),
  });
}

export async function sendDigestEmail(params: {
  to: string;
  items: Array<{ job: Job; pkg: ApplicationPackage; matchUrl: string }>;
}) {
  if (params.items.length === 0) return;

  const resend = getResend();
  const body = params.items
    .map(({ job, pkg, matchUrl }) => renderMatchHtml(job, pkg, matchUrl))
    .join("<hr/>");

  await resend.emails.send({
    from: fromAddress(),
    to: params.to,
    subject: `${params.items.length} job${params.items.length === 1 ? "" : "s"} with unstated salary — daily digest`,
    html: `<p>These matched your target roles but didn't state a salary, so they're grouped here instead of sent instantly.</p>${body}`,
  });
}
