import { Rss } from "lucide-react";
import { db } from "@/lib/db/client";
import { jobSources } from "@/lib/db/schema";
import { createJobSource, toggleJobSource, deleteJobSource } from "@/lib/actions";

const IMPLEMENTED: Record<string, boolean> = {
  telegram: true,
  naukri: false,
  wellfound: false,
  linkedin: false,
  foundit: false,
};

export default async function SourcesPage() {
  const sources = await db.select().from(jobSources);

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Job sources</h1>
        <p className="mt-1 text-sm text-slate-500">
          Only Telegram is implemented in this pass — the others are wired up in the UI but their adapters are
          stubs (they always return zero results) until a follow-up build fills them in.
        </p>
      </div>

      {sources.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-12 text-center">
          <Rss className="h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-500">No sources configured yet.</p>
        </div>
      ) : (
        <ul className="card flex flex-col divide-y divide-slate-200">
          {sources.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                  <Rss className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="font-medium text-slate-900">
                    {s.name} <span className="text-xs text-slate-500">({s.type})</span>
                    {!IMPLEMENTED[s.type] && <span className="badge-warning ml-2">not yet implemented</span>}
                  </p>
                  <p className="text-sm text-slate-500">
                    {s.enabled ? "Enabled" : "Disabled"} · every {s.pollIntervalMinutes}min
                    {s.consecutiveFailures > 0 && ` · ${s.consecutiveFailures} recent failure(s)`}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-3">
                <form action={toggleJobSource.bind(null, s.id, !s.enabled)}>
                  <button type="submit" className="text-sm font-medium text-teal-600 hover:text-teal-500">
                    {s.enabled ? "Disable" : "Enable"}
                  </button>
                </form>
                <form action={deleteJobSource.bind(null, s.id)}>
                  <button type="submit" className="text-sm font-medium text-rose-600 hover:text-rose-500">
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={createJobSource} className="card flex flex-col gap-3 p-6">
        <h2 className="flex items-center gap-2 font-medium text-slate-900">
          <Rss className="h-4 w-4 text-slate-400" />
          Add a source
        </h2>
        <select name="type" className="input">
          <option value="telegram">Telegram</option>
          <option value="naukri">Naukri.com (not yet implemented)</option>
          <option value="wellfound">Wellfound (not yet implemented)</option>
          <option value="linkedin">LinkedIn (not yet implemented)</option>
          <option value="foundit">foundit (not yet implemented)</option>
        </select>
        <input type="text" name="name" required placeholder="Label, e.g. 'Hiring India channel'" className="input" />
        <textarea
          name="config"
          required
          rows={3}
          placeholder={'{"channel": "somechannelusername"}'}
          className="input font-mono"
        />
        <p className="text-xs text-slate-500">
          For Telegram, config is <code>{'{"channel": "<public channel username, no @>"}'}</code>.
        </p>
        <button type="submit" className="btn-primary w-fit">
          Add source
        </button>
      </form>
    </div>
  );
}
