import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from a Server Component during render; the
            // middleware below refreshes the session, so this can be ignored.
          }
        },
      },
    }
  );
}

/**
 * Every dashboard page needs the current user; the proxy (middleware.ts)
 * already redirects unauthenticated requests to /login before a page ever
 * renders, but that's a separate request/response cycle from this one — it
 * doesn't guarantee getUser() resolves non-null here (a race on session
 * expiry, a stale cookie, etc). Pages used a bare `user!.id` non-null
 * assertion, which is a silent no-op at runtime: if `user` really is null,
 * that crashes with a raw TypeError and Next's default error boundary wipes
 * the entire layout (sidebar included) instead of just showing the page.
 * This makes the same situation a clean redirect instead.
 */
export async function requireUser(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  return user;
}
