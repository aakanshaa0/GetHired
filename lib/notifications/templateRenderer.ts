export const TEMPLATE_PLACEHOLDERS = [
  "company",
  "role_title",
  "my_name",
  "college",
  "years_experience",
  "target_track",
  "job_url",
] as const;

export type TemplateVars = Record<(typeof TEMPLATE_PLACEHOLDERS)[number], string>;

/** Plain {{placeholder}} substitution — deliberately not LLM-generated text, per the user's request for a template they control. */
export function renderTemplate(body: string, vars: Partial<TemplateVars>): string {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
    return key in vars ? String(vars[key as keyof TemplateVars] ?? "") : match;
  });
}
