import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for scripts/ (GitHub Actions ingestion jobs) that need
 * to look up auth data (e.g. a user's email for notifications) outside of a
 * request/session context. Never import this into client-facing app code.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set. See .env.local.example / SETUP.md."
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
