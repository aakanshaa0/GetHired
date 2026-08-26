export interface ParsedSalary {
  min: number;
  max: number;
  currency: string;
  period: "annual" | "monthly";
  confidence: "known" | "estimated";
  rawText: string;
}

const LPA_RANGE = /(\d+(?:\.\d+)?)\s*(?:-|to|–)\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?\s*(?:per\s*annum|p\.?a\.?)?)/i;
const LPA_SINGLE = /(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?\s*(?:per\s*annum|p\.?a\.?)?)/i;
const RUPEE_ANNUAL_RANGE =
  /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)\s*(?:-|to|–)\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(?:\/|per\s*)?\s*(?:year|annum|yr|pa)\b/i;
const MONTHLY_K_RANGE = /(\d+(?:\.\d+)?)\s*k\s*(?:-|to|–)\s*(\d+(?:\.\d+)?)\s*k\s*(?:\/|per)?\s*month/i;
const MONTHLY_K_SINGLE = /(\d+(?:\.\d+)?)\s*k\s*(?:\/|per)?\s*month/i;
const RUPEE_MONTHLY = /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)\s*(?:\/|per)?\s*month/i;

function toNumber(raw: string): number {
  return parseFloat(raw.replace(/,/g, ""));
}

/**
 * Best-effort regex extraction of an Indian salary range from free text.
 * Returns null when nothing recognizable is found — callers should fall
 * back to LLM-based extraction rather than guessing.
 */
export function parseSalaryFromText(text: string): ParsedSalary | null {
  let m = text.match(LPA_RANGE);
  if (m) {
    return {
      min: toNumber(m[1]) * 100000,
      max: toNumber(m[2]) * 100000,
      currency: "INR",
      period: "annual",
      confidence: "known",
      rawText: m[0],
    };
  }

  m = text.match(RUPEE_ANNUAL_RANGE);
  if (m) {
    return {
      min: toNumber(m[1]),
      max: toNumber(m[2]),
      currency: "INR",
      period: "annual",
      confidence: "known",
      rawText: m[0],
    };
  }

  m = text.match(LPA_SINGLE);
  if (m) {
    const value = toNumber(m[1]) * 100000;
    return {
      min: value,
      max: value,
      currency: "INR",
      period: "annual",
      confidence: "known",
      rawText: m[0],
    };
  }

  m = text.match(MONTHLY_K_RANGE);
  if (m) {
    return {
      min: toNumber(m[1]) * 1000 * 12,
      max: toNumber(m[2]) * 1000 * 12,
      currency: "INR",
      period: "annual",
      confidence: "estimated",
      rawText: m[0],
    };
  }

  m = text.match(MONTHLY_K_SINGLE);
  if (m) {
    const value = toNumber(m[1]) * 1000 * 12;
    return {
      min: value,
      max: value,
      currency: "INR",
      period: "annual",
      confidence: "estimated",
      rawText: m[0],
    };
  }

  m = text.match(RUPEE_MONTHLY);
  if (m) {
    const value = toNumber(m[1]) * 12;
    return {
      min: value,
      max: value,
      currency: "INR",
      period: "annual",
      confidence: "estimated",
      rawText: m[0],
    };
  }

  return null;
}

/** Converts an annualized INR salary figure to LPA for threshold comparisons. */
export function toLpa(annualInr: number): number {
  return annualInr / 100000;
}
