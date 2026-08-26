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
        <h1 className="text-2xl font-semibold">Job sources</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Only Telegram is implemented in this pass — the others are wired up in the UI but their adapters are
          stubs (they always return zero results) until a follow-up build fills them in.
        </p>
      </div>

      <ul className="flex flex-col divide-y divide-neutral-200 rounded-md border border-neutral-200">
        {sources.length === 0 && <li className="p-4 text-sm text-neutral-500">No sources configured yet.</li>}
        {sources.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium">
                {s.name} <span className="text-xs text-neutral-500">({s.type})</span>
                {!IMPLEMENTED[s.type] && <span className="ml-2 text-xs text-amber-700">not yet implemented</span>}
              </p>
              <p className="text-sm text-neutral-500">
                {s.enabled ? "Enabled" : "Disabled"} · every {s.pollIntervalMinutes}min
                {s.consecutiveFailures > 0 && ` · ${s.consecutiveFailures} recent failure(s)`}
              </p>
            </div>
            <div className="flex gap-2">
              <form action={toggleJobSource.bind(null, s.id, !s.enabled)}>
                <button type="submit" className="text-sm underline">
                  {s.enabled ? "Disable" : "Enable"}
                </button>
              </form>
              <form action={deleteJobSource.bind(null, s.id)}>
                <button type="submit" className="text-sm text-red-600 underline">
                  Delete
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      <form action={createJobSource} className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4">
        <h2 className="font-medium">Add a source</h2>
        <select name="type" className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
          <option value="telegram">Telegram</option>
          <option value="naukri">Naukri.com (not yet implemented)</option>
          <option value="wellfound">Wellfound (not yet implemented)</option>
          <option value="linkedin">LinkedIn (not yet implemented)</option>
          <option value="foundit">foundit (not yet implemented)</option>
        </select>
        <input
          type="text"
          name="name"
          required
          placeholder="Label, e.g. 'Hiring India channel'"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <textarea
          name="config"
          required
          rows={3}
          placeholder={'{"channel": "somechannelusername"}'}
          className="rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm"
        />
        <p className="text-xs text-neutral-500">
          For Telegram, config is <code>{'{"channel": "<public channel username, no @>"}'}</code>.
        </p>
        <button type="submit" className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
          Add source
        </button>
      </form>
    </div>
  );
}
