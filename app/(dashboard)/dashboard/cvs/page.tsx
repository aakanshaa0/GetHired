import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { cvs } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { deleteCv, setDefaultCv } from "@/lib/actions";

export default async function CvsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userCvs = await db.select().from(cvs).where(eq(cvs.userId, user!.id));

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <h1 className="text-2xl font-semibold">CVs</h1>

      <ul className="flex flex-col divide-y divide-neutral-200 rounded-md border border-neutral-200">
        {userCvs.length === 0 && <li className="p-4 text-sm text-neutral-500">No CVs uploaded yet.</li>}
        {userCvs.map((cv) => (
          <li key={cv.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">
                {cv.fileName} {cv.isDefault && <span className="text-xs text-neutral-500">(default)</span>}
              </p>
              <p className="text-sm text-neutral-500">
                {cv.roleTag}
                {cv.keywords.length > 0 ? ` · ${cv.keywords.join(", ")}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              {!cv.isDefault && (
                <form action={setDefaultCv.bind(null, cv.id)}>
                  <button type="submit" className="text-sm underline">
                    Set default
                  </button>
                </form>
              )}
              <form action={deleteCv.bind(null, cv.id)}>
                <button type="submit" className="text-sm text-red-600 underline">
                  Delete
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      <form action="/api/cvs/upload" method="POST" encType="multipart/form-data" className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4">
        <h2 className="font-medium">Upload a new CV</h2>
        <input type="file" name="file" required accept=".pdf,.doc,.docx" className="text-sm" />
        <input
          type="text"
          name="roleTag"
          required
          placeholder="Role tag, e.g. backend"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          type="text"
          name="keywords"
          placeholder="Keywords, comma-separated, e.g. node, postgres, aws"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
          Upload
        </button>
      </form>
    </div>
  );
}
