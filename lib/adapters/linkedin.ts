import type { JobSourceAdapter, RawJob, NormalizedJob } from "./types";

export interface LinkedInSourceConfig {
  keywords: string[];
  location?: string;
}

/**
 * STUB — not implemented yet. Build LAST (Phase 5), after the other three,
 * because it is the highest-risk source: LinkedIn's ToS prohibits scraping,
 * and they enforce aggressively against automated/non-browser traffic even
 * on the logged-out "guest" job search pages
 * (linkedin.com/jobs/search?keywords=...&location=...). Do NOT log in from
 * this adapter — no credentials, no session cookies, ever. When implemented:
 *   - Use the guest search pages only, at very low frequency (a few times a
 *     day at most, one query per run).
 *   - Treat this as inherently fragile: wire `job_sources.consecutive_failures`
 *     so that after ~3 consecutive failures the ingest runner flips
 *     `job_sources.enabled = false` and sends the user an email saying the
 *     LinkedIn source disabled itself, instead of retrying forever against
 *     what might now be a block/CAPTCHA page.
 *   - Label LinkedIn-sourced jobs in the UI as best-effort/may-be-stale
 *     rather than presenting this source as equally reliable as the others.
 * Keep `job_sources.enabled = false` until fetchRaw is implemented.
 */
export const linkedinAdapter: JobSourceAdapter = {
  type: "linkedin",
  async fetchRaw(_config: Record<string, unknown>): Promise<RawJob[]> {
    return [];
  },
  normalize(_raw: RawJob): NormalizedJob | null {
    return null;
  },
};
