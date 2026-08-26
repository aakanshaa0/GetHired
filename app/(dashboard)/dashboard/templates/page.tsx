import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { referralTemplates } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { createReferralTemplate, deleteReferralTemplate, setDefaultTemplate } from "@/lib/actions";
import { TEMPLATE_PLACEHOLDERS } from "@/lib/notifications/templateRenderer";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const templates = await db.select().from(referralTemplates).where(eq(referralTemplates.userId, user!.id));

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Referral templates</h1>
        <p className="mt-1 text-sm text-neutral-500">
          The default template is rendered and attached to every new match. Available placeholders:{" "}
          {TEMPLATE_PLACEHOLDERS.map((p) => `{{${p}}}`).join(", ")}.
        </p>
      </div>

      <ul className="flex flex-col divide-y divide-neutral-200 rounded-md border border-neutral-200">
        {templates.length === 0 && <li className="p-4 text-sm text-neutral-500">No templates yet.</li>}
        {templates.map((t) => (
          <li key={t.id} className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">
                {t.name} {t.isDefault && <span className="text-xs text-neutral-500">(default)</span>}
              </p>
              <div className="flex gap-2">
                {!t.isDefault && (
                  <form action={setDefaultTemplate.bind(null, t.id)}>
                    <button type="submit" className="text-sm underline">
                      Set default
                    </button>
                  </form>
                )}
                <form action={deleteReferralTemplate.bind(null, t.id)}>
                  <button type="submit" className="text-sm text-red-600 underline">
                    Delete
                  </button>
                </form>
              </div>
            </div>
            <p className="whitespace-pre-wrap text-sm text-neutral-600">{t.body}</p>
          </li>
        ))}
      </ul>

      <form action={createReferralTemplate} className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4">
        <h2 className="font-medium">New template</h2>
        <input
          type="text"
          name="name"
          required
          placeholder="Template name"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <textarea
          name="body"
          required
          rows={6}
          placeholder={`Hi! I noticed {{company}} is hiring for {{role_title}}. I'm {{my_name}}, a ${"{{years_experience}}"}-year ${"{{target_track}}"} background from {{college}}. Would you be open to referring me? Job link: {{job_url}}`}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
          Save template
        </button>
      </form>
    </div>
  );
}
