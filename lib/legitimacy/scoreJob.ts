import { getAnthropicClient, EXTRACTION_MODEL } from "../llm/anthropicClient";
import { lookupCompany, touchCompany, promoteToWhitelist } from "./companyCache";

export interface LegitimacyResult {
  verdict: "legit" | "suspicious" | "scam";
  confidence: number;
  reasoning: string;
  flags: string[];
  model: string;
}

const FLAG_CODES = [
  "no_verifiable_company",
  "upfront_fee_mentioned",
  "unrealistic_salary",
  "generic_email_domain",
  "vague_description",
  "urgency_pressure_tactics",
  "personal_info_requested_early",
  "no_company_website",
] as const;

const SYSTEM_PROMPT = `You screen job postings for an individual job seeker to flag likely scams before they apply. \
Be conservative about labeling something "scam" — false accusations against real companies are costly — but do not hesitate to flag genuine red flags. \
Standard scam signals to watch for: requests for upfront payment/deposit/"training fee"; unrealistically high pay for minimal-skill work; \
vague or copy-pasted descriptions with no real duties; pressure to decide/pay immediately; requests for sensitive personal/financial info before any interview; \
contact only via personal chat apps with no verifiable company presence. \
Use only these flag codes when applicable: ${FLAG_CODES.join(", ")}.`;

const SCORE_TOOL = {
  name: "record_legitimacy_verdict",
  description: "Record a scam-risk verdict for a job posting.",
  input_schema: {
    type: "object" as const,
    properties: {
      verdict: { type: "string", enum: ["legit", "suspicious", "scam"] },
      confidence: { type: "number", description: "0 to 1." },
      reasoning: { type: "string", description: "One to three sentences explaining the verdict." },
      flags: { type: "array", items: { type: "string", enum: [...FLAG_CODES] } },
    },
    required: ["verdict", "confidence", "reasoning", "flags"],
  },
};

export async function scoreJobLegitimacy(job: {
  title: string;
  companyName: string;
  descriptionText: string | null;
  salaryRawText: string | null;
  applyUrl: string;
}): Promise<LegitimacyResult> {
  const cached = await lookupCompany(job.companyName);

  if (cached?.legitimacyStatus === "whitelisted") {
    await touchCompany(job.companyName);
    return {
      verdict: "legit",
      confidence: 1,
      reasoning: `${job.companyName} is on the known-legitimate company list.`,
      flags: [],
      model: "whitelist-cache",
    };
  }

  if (cached?.legitimacyStatus === "blacklisted") {
    await touchCompany(job.companyName);
    return {
      verdict: "scam",
      confidence: 1,
      reasoning: `${job.companyName} is on the blocked-company list${cached.notes ? `: ${cached.notes}` : "."}`,
      flags: ["no_verifiable_company"],
      model: "blacklist-cache",
    };
  }

  await touchCompany(job.companyName);

  try {
    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: EXTRACTION_MODEL,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      tools: [SCORE_TOOL],
      tool_choice: { type: "tool", name: "record_legitimacy_verdict" },
      messages: [
        {
          role: "user",
          content: `Title: ${job.title}\nCompany: ${job.companyName}\nSalary as stated: ${job.salaryRawText ?? "not stated"}\nApply link: ${job.applyUrl}\n\nDescription:\n${job.descriptionText ?? "(none provided)"}`,
        },
      ],
    });

    const toolUse = message.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("No tool_use block in legitimacy scoring response");
    }

    const result = toolUse.input as Omit<LegitimacyResult, "model">;

    if (result.verdict === "legit" && result.confidence >= 0.85) {
      await promoteToWhitelist(job.companyName);
    }

    return { ...result, model: EXTRACTION_MODEL };
  } catch (err) {
    // Fail safe to 'suspicious' rather than silently defaulting to 'legit' —
    // an unscored/uncertain posting should still get a visible warning badge
    // rather than skip the gate in scripts/process-new-jobs.ts.
    return {
      verdict: "suspicious",
      confidence: 0,
      reasoning: `Automatic legitimacy scoring failed (${err instanceof Error ? err.message : "unknown error"}); review manually.`,
      flags: [],
      model: "error-fallback",
    };
  }
}
