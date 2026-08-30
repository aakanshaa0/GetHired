import { eq } from "drizzle-orm";
import { FileStack, Upload } from "lucide-react";
import { db } from "@/lib/db/client";
import { cvs } from "@/lib/db/schema";
import { requireUser } from "@/lib/supabase/server";
import { deleteCv, setDefaultCv } from "@/lib/actions";
import FileDropzone from "./FileDropzone";

export default async function CvsPage() {
  const user = await requireUser();

  const userCvs = await db.select().from(cvs).where(eq(cvs.userId, user.id));

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <h1 className="text-2xl font-semibold text-slate-900">CVs</h1>

      {userCvs.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-12 text-center">
          <FileStack className="h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-500">No CVs uploaded yet.</p>
        </div>
      ) : (
        <ul className="card flex flex-col divide-y divide-slate-200">
          {userCvs.map((cv) => (
            <li key={cv.id} className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                  <FileStack className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="font-medium text-slate-900">
                    {cv.fileName} {cv.isDefault && <span className="badge-neutral ml-1">default</span>}
                  </p>
                  <p className="text-sm text-slate-500">
                    {cv.roleTag}
                    {cv.keywords.length > 0 ? ` · ${cv.keywords.join(", ")}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {!cv.isDefault && (
                  <form action={setDefaultCv.bind(null, cv.id)}>
                    <button type="submit" className="text-sm font-medium text-teal-600 hover:text-teal-500">
                      Set default
                    </button>
                  </form>
                )}
                <form action={deleteCv.bind(null, cv.id)}>
                  <button type="submit" className="text-sm font-medium text-rose-600 hover:text-rose-500">
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action="/api/cvs/upload" method="POST" encType="multipart/form-data" className="card flex flex-col gap-4 p-6">
        <h2 className="flex items-center gap-2 font-medium text-slate-900">
          <Upload className="h-4 w-4 text-slate-400" />
          Upload a new CV
        </h2>

        <FileDropzone />

        <div className="flex flex-col gap-1">
          <label className="label" htmlFor="roleTag">
            Role tag <span className="text-rose-500">*</span>
          </label>
          <input id="roleTag" type="text" name="roleTag" required placeholder="e.g. backend, fullstack, data-analyst" className="input" />
          <p className="text-xs text-slate-500">
            A short label for which track this CV is for. If you only have one CV, use something like{" "}
            <code>fullstack</code>.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="label" htmlFor="keywords">
            Keywords <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input id="keywords" type="text" name="keywords" placeholder="react, nextjs, node, sql, aws" className="input" />
          <p className="text-xs text-slate-500">
            Comma-separated skills from this CV — matched against job titles/descriptions to auto-pick this CV
            for relevant postings.
          </p>
        </div>

        <button type="submit" className="btn-primary w-fit">
          Upload
        </button>
      </form>
    </div>
  );
}
