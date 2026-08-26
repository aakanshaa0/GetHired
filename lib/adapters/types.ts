export type SourceType = "telegram" | "naukri" | "wellfound" | "linkedin" | "foundit";

export interface RawJob {
  externalId: string;
  rawText: string;
  rawPayload: Record<string, unknown>;
  sourceUrl: string;
  postedAt: Date | null;
}

export interface NormalizedJob {
  title: string;
  companyName: string;
  location: string | null;
  isRemote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryPeriod: "annual" | "monthly" | null;
  salaryRawText: string | null;
  salaryConfidence: "known" | "estimated" | "unknown";
  applyUrl: string;
  postedAt: Date | null;
  descriptionText: string;
}

export interface JobSourceAdapter {
  type: SourceType;
  /** Fetch new raw postings for a single configured source instance. */
  fetchRaw(config: Record<string, unknown>): Promise<RawJob[]>;
  /**
   * Turn a raw posting into the normalized shape. Return null when the
   * adapter can't confidently parse required fields (title/company/applyUrl)
   * so the caller can fall back to LLM-based extraction instead.
   */
  normalize(raw: RawJob): NormalizedJob | null;
}
