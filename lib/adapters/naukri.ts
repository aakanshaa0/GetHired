import type { JobSourceAdapter, RawJob, NormalizedJob } from "./types";

export interface NaukriSourceConfig {
  keywords: string[];
  location?: string;
}

/**
 * STUB — not implemented yet (Phase 3, after Wellfound).
 * Naukri's search-result pages (naukri.com/<keywords>-jobs) are public but
 * JS-rendered and moderately anti-bot protected — expect to need Playwright
 * (headless browser) rather than plain fetch, run inside the GitHub Actions
 * runner (not a Vercel function). Poll at low frequency (e.g. hourly, one
 * query at a time) to reduce IP-blocking risk, and wire this source into the
 * `job_sources.consecutive_failures` circuit breaker (see linkedin.ts) since
 * markup/anti-bot behavior can change without notice. Keep
 * `job_sources.enabled = false` until fetchRaw is implemented.
 */
export const naukriAdapter: JobSourceAdapter = {
  type: "naukri",
  async fetchRaw(_config: Record<string, unknown>): Promise<RawJob[]> {
    return [];
  },
  normalize(_raw: RawJob): NormalizedJob | null {
    return null;
  },
};
