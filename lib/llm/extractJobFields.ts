import { getAnthropicClient, EXTRACTION_MODEL } from "./anthropicClient";

export interface ExtractedJobFields {
  title: string | null;
  companyName: string | null;
  location: string | null;
  isRemote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: "annual" | "monthly" | null;
  salaryConfidence: "known" | "estimated" | "unknown";
  isJobPosting: boolean;
}

const EXTRACT_TOOL = {
  name: "record_job_fields",
  description: "Record structured fields extracted from a job posting's free text.",
  input_schema: {
    type: "object" as const,
    properties: {
      isJobPosting: {
        type: "boolean",
        description: "False if this text is not actually a job posting (e.g. chit-chat, an ad, a repost with no details).",
      },
      title: { type: ["string", "null"], description: "Job title, or null if not stated." },
      companyName: { type: ["string", "null"], description: "Hiring company name, or null if not stated." },
      location: { type: ["string", "null"], description: "City/region, or null if not stated." },
      isRemote: { type: "boolean" },
      salaryMin: { type: ["number", "null"], description: "Annualized minimum salary in INR, or null." },
      salaryMax: { type: ["number", "null"], description: "Annualized maximum salary in INR, or null." },
      salaryConfidence: {
        type: "string",
        enum: ["known", "estimated", "unknown"],
        description: "'known' if a figure was explicitly stated, 'estimated' if inferred/converted, 'unknown' if absent.",
      },
      salaryPeriod: { type: ["string", "null"], enum: ["annual", "monthly", null] },
    },
    required: ["isJobPosting", "title", "companyName", "location", "isRemote", "salaryMin", "salaryMax", "salaryConfidence", "salaryPeriod"],
  },
};

/**
 * Falls back to an LLM when regex parsing can't confidently pull structured
 * fields out of messy free text (mainly Telegram posts). Returns null on any
 * API failure so callers can skip the posting rather than throw the whole
 * ingestion run.
 */
export async function extractJobFields(rawText: string): Promise<ExtractedJobFields | null> {
  try {
    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: EXTRACTION_MODEL,
      max_tokens: 512,
      tools: [EXTRACT_TOOL],
      tool_choice: { type: "tool", name: "record_job_fields" },
      messages: [
        {
          role: "user",
          content: `Extract structured fields from this job posting text. All salary figures should be converted to an annualized INR amount (e.g. "40k/month" -> min=max=480000).\n\n---\n${rawText}\n---`,
        },
      ],
    });

    const toolUse = message.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") return null;

    return toolUse.input as ExtractedJobFields;
  } catch {
    return null;
  }
}
