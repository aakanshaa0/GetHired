import type { jobs, profiles, cvs, referralTemplates } from "../db/schema";
import { renderTemplate } from "../notifications/templateRenderer";

type Job = typeof jobs.$inferSelect;
type Profile = typeof profiles.$inferSelect;
type Cv = typeof cvs.$inferSelect;
type ReferralTemplate = typeof referralTemplates.$inferSelect;

export interface ApplicationPackage {
  cv: Cv | null;
  referralText: string | null;
  legitimacySummary: {
    verdict: Job["legitimacyVerdict"];
    confidence: number | null;
    reasoning: string | null;
    flags: string[];
  };
  applyUrl: string;
}

/**
 * Single source of truth for turning a match into what the user sees —
 * consumed identically by the email renderer and the staged-application
 * dashboard page, so referral-text formatting never drifts between the two.
 */
export function buildApplicationPackage(params: {
  job: Job;
  profile: Profile;
  cv: Cv | null;
  template: ReferralTemplate | null;
}): ApplicationPackage {
  const { job, profile, cv, template } = params;

  const referralText = template
    ? renderTemplate(template.body, {
        company: job.companyName,
        role_title: job.title,
        my_name: profile.fullName ?? "",
        college: profile.college ?? "",
        years_experience: profile.yearsExperience != null ? String(profile.yearsExperience) : "",
        target_track: cv?.roleTag ?? "",
        job_url: job.applyUrl,
      })
    : null;

  return {
    cv,
    referralText,
    legitimacySummary: {
      verdict: job.legitimacyVerdict,
      confidence: job.legitimacyConfidence,
      reasoning: job.legitimacyReasoning,
      flags: (job.legitimacyFlags as string[] | null) ?? [],
    },
    applyUrl: job.applyUrl,
  };
}
