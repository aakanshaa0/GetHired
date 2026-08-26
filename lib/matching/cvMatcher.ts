export interface CvForMatching {
  id: string;
  roleTag: string;
  keywords: string[];
}

export interface JobForMatching {
  title: string;
  descriptionText: string | null;
}

export interface CvMatchResult {
  cvId: string | null;
  score: number;
  matchedKeywords: string[];
}

const MIN_MATCH_SCORE = 1;

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9+#]+/i)
      .filter((w) => w.length > 1)
  );
}

/**
 * Naive keyword-overlap matcher: picks the CV whose role_tag + keywords
 * overlap most with the job's title/description. Good enough for an MVP
 * with a handful of CVs; an embeddings-based matcher is a reasonable future
 * upgrade if keyword overlap starts picking the wrong CV often.
 */
export function pickBestCv(job: JobForMatching, cvs: CvForMatching[]): CvMatchResult {
  const jobTokens = tokenize(`${job.title} ${job.descriptionText ?? ""}`);

  let best: CvMatchResult = { cvId: null, score: 0, matchedKeywords: [] };

  for (const cv of cvs) {
    const cvTerms = [cv.roleTag, ...cv.keywords].map((t) => t.toLowerCase());
    const matched = cvTerms.filter((term) =>
      term.split(/\s+/).every((word) => jobTokens.has(word))
    );

    if (matched.length > best.score) {
      best = { cvId: cv.id, score: matched.length, matchedKeywords: matched };
    }
  }

  if (best.score < MIN_MATCH_SCORE) {
    return { cvId: null, score: 0, matchedKeywords: [] };
  }

  return best;
}
