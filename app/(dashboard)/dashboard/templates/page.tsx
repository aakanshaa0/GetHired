import { eq } from "drizzle-orm";
import { MessageSquareText } from "lucide-react";
import { db } from "@/lib/db/client";
import { referralTemplates } from "@/lib/db/schema";
import { requireUser } from "@/lib/supabase/server";
import { createReferralTemplate, deleteReferralTemplate, setDefaultTemplate } from "@/lib/actions";
import { TEMPLATE_PLACEHOLDERS } from "@/lib/notifications/templateRenderer";

export default async function TemplatesPage() {
  const user = await requireUser();

  const templates = await db.select().from(referralTemplates).where(eq(referralTemplates.userId, user.id));

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Referral templates</h1>
        <p className="mt-1 text-sm text-slate-500">
          The default template is rendered and attached to every new match. Available placeholders:{" "}
          {TEMPLATE_PLACEHOLDERS.map((p) => `{{${p}}}`).join(", ")}.
        </p>
      </div>

      {templates.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-12 text-center">
          <MessageSquareText className="h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-500">No templates yet.</p>
        </div>
      ) : (
        <ul className="card flex flex-col divide-y divide-slate-200">
          {templates.map((t) => (
            <li key={t.id} className="flex flex-col gap-2 p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-900">
                  {t.name} {t.isDefault && <span className="badge-neutral ml-1">default</span>}
                </p>
                <div className="flex gap-3">
                  {!t.isDefault && (
                    <form action={setDefaultTemplate.bind(null, t.id)}>
                      <button type="submit" className="text-sm font-medium text-teal-600 hover:text-teal-500">
                        Set default
                      </button>
                    </form>
                  )}
                  <form action={deleteReferralTemplate.bind(null, t.id)}>
                    <button type="submit" className="text-sm font-medium text-rose-600 hover:text-rose-500">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm text-slate-600">{t.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form action={createReferralTemplate} className="card flex flex-col gap-3 p-6">
        <h2 className="flex items-center gap-2 font-medium text-slate-900">
          <MessageSquareText className="h-4 w-4 text-slate-400" />
          New template
        </h2>
        <input type="text" name="name" required placeholder="Template name" className="input" />
        <textarea
          name="body"
          required
          rows={6}
          placeholder={`Hi! I noticed {{company}} is hiring for {{role_title}}. I'm {{my_name}}, a ${"{{years_experience}}"}-year ${"{{target_track}}"} background from {{college}}. Would you be open to referring me? Job link: {{job_url}}`}
          className="input"
        />
        <button type="submit" className="btn-primary w-fit">
          Save template
        </button>
      </form>
    </div>
  );
}
