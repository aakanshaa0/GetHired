import type { JobSourceAdapter, RawJob, NormalizedJob } from "./types";

export interface FounditSourceConfig {
  keywords: string[];
  location?: string;
}

/**
 * STUB — not implemented yet (Phase 4, after Naukri).
 * foundit.in (formerly Monster India) search-result pages are public;
 * expect a similar shape to naukri.ts (likely Playwright, moderate anti-bot
 * risk, low-frequency polling, same circuit-breaker pattern). Build after
 * Naukri so the two can share whatever HTML-scraping helpers turn out to be
 * common between them. Keep `job_sources.enabled = false` until fetchRaw is
 * implemented.
 */
export const founditAdapter: JobSourceAdapter = {
  type: "foundit",
  async fetchRaw(_config: Record<string, unknown>): Promise<RawJob[]> {
    return [];
  },
  normalize(_raw: RawJob): NormalizedJob | null {
    return null;
  },
};
