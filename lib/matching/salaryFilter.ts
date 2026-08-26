import { toLpa } from "./salaryParser";

export type SalaryFilterResult = "above_threshold" | "below_threshold" | "unknown";

export function evaluateSalary(
  job: {
    salaryConfidence: "known" | "estimated" | "unknown";
    salaryMin: number | null;
    salaryMax: number | null;
  },
  minSalaryLpa: number
): SalaryFilterResult {
  if (job.salaryConfidence === "unknown" || (job.salaryMin == null && job.salaryMax == null)) {
    return "unknown";
  }

  // Use the top of the stated range as the comparison point: a posted range
  // is a negotiable band, and erring inclusive avoids silently dropping a
  // job that would pay well for a strong candidate.
  const topAnnual = job.salaryMax ?? job.salaryMin ?? 0;
  return toLpa(topAnnual) >= minSalaryLpa ? "above_threshold" : "below_threshold";
}
