import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import { cvs } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const formData = await request.formData();
  const file = formData.get("file");
  const roleTag = String(formData.get("roleTag") ?? "").trim();
  const keywords = String(formData.get("keywords") ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (!(file instanceof File) || !roleTag) {
    return NextResponse.json({ error: "A file and role tag are required" }, { status: 400 });
  }

  const storagePath = `${user.id}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("cvs").upload(storagePath, file, {
    contentType: file.type || "application/octet-stream",
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  await db.insert(cvs).values({
    userId: user.id,
    roleTag,
    keywords,
    storagePath,
    fileName: file.name,
  });

  return NextResponse.redirect(new URL("/dashboard/cvs", request.url), { status: 303 });
}
