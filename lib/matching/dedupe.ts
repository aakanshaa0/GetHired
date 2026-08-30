import { normalizeCompanyName } from "../legitimacy/companyCache";

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Same channel commonly reposts the identical opportunity within minutes
 * (a "pinned" wrapper message plus a plain duplicate, or a manual repost) —
 * each as a distinct Telegram message, so external_id-based dedup on
 * raw_jobs doesn't catch it. Company+title normalized together is a good
 * enough signal that two postings describe the same real opportunity.
 */
export function computeDedupeHash(companyName: string, title: string): string {
  return `${normalizeCompanyName(companyName)}::${normalizeTitle(title)}`;
}
