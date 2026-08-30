import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // No ?code= — this can happen when Supabase issues an implicit-flow link
  // (tokens as a #access_token=... URL fragment instead of a query param,
  // e.g. for admin-issued links, or if PKCE's code_verifier cookie didn't
  // survive). A server route can never see a fragment (browsers don't send
  // it), so hand off to a client page that can read window.location.hash.
  return NextResponse.redirect(`${origin}/auth/callback/complete`);
}
