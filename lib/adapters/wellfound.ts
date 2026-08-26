import type { JobSourceAdapter, RawJob, NormalizedJob } from "./types";

export interface WellfoundSourceConfig {
  keywords: string[];
  location?: string;
}

/**
 * STUB — not implemented yet. Recommended next-source-to-build (Phase 2):
 * Wellfound's startup job listings are the most scrape-tolerant of the
 * remaining four sources. Approach: their public job search
 * (wellfound.com/role/r/<role-slug>) returns server-rendered HTML with
 * structured job cards (title, company, location, salary range often
 * present) — likely parseable with plain `fetch` + cheerio, no headless
 * browser needed. Verify current markup before implementing; it changes
 * periodically. Keep `job_sources.enabled = false` for this type until
 * fetchRaw is implemented.
 */
export const wellfoundAdapter: JobSourceAdapter = {
  type: "wellfound",
  async fetchRaw(_config: Record<string, unknown>): Promise<RawJob[]> {
    return [];
  },
  normalize(_raw: RawJob): NormalizedJob | null {
    return null;
  },
};
