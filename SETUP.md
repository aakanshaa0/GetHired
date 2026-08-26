# Setup

Everything below happens in accounts you control — nothing here can be created on your behalf. Work through it top to bottom; each section says exactly what to click/copy.

## 1. Supabase (database, auth, CV storage)

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. **Project Settings -> API**: copy the "Project URL" and the `anon` `public` key -> these become `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Same page: copy the `service_role` key (keep secret, never expose client-side) -> `SUPABASE_SERVICE_ROLE_KEY`.
4. **Project Settings -> Database -> Connection string -> URI**: copy it, put your DB password in, -> `DATABASE_URL`.
5. **Authentication -> Providers**: confirm "Email" is enabled. **Authentication -> URL Configuration**: add `http://localhost:3000/auth/callback` (and later your production URL + `/auth/callback`) to Redirect URLs.
6. **Storage**: create a new bucket named exactly `cvs`. Leave it private (not public) — the app generates short-lived signed URLs to serve downloads.

## 2. Anthropic API key

Create a key at [console.anthropic.com](https://console.anthropic.com) -> `ANTHROPIC_API_KEY`. Used for parsing messy job text and scam/legitimacy scoring (`claude-haiku-4-5`). At personal-project volume this should cost well under $1/month.

## 3. Resend (email)

Create an account at [resend.com](https://resend.com) and an API key -> `RESEND_API_KEY`. For real use, verify a sending domain (Resend -> Domains) and set `RESEND_FROM_EMAIL` to an address on it; for quick testing you can leave the default `onboarding@resend.dev` sender, which only delivers to the email you signed up with.

## 4. Local development

1. Copy `.env.local.example` to `.env.local` and fill in everything from steps 1-3, plus `NEXT_PUBLIC_APP_URL=http://localhost:3000`.
2. `npm install`
3. Push the schema to your Supabase database: `npx drizzle-kit push` (schema.ts declares a stub `auth.users` table purely so Drizzle can add foreign keys to it — Supabase already owns that table, and the checked-in migration has the stub's own `CREATE TABLE` stripped out; if you ever regenerate migrations from a schema change, re-check the new SQL file for a stray `CREATE TABLE "auth"."users"` and delete it before applying)
4. Seed the company whitelist: `npx tsx scripts/seed.ts`
5. `npm run dev`, open `http://localhost:3000`, sign in with your email (magic link).
6. On the **Sources** page, add a Telegram source with config `{"channel": "<some public job-posting channel's username, no @>"}`.
7. Fill in your **Profile**, upload a **CV**, add a default **Referral template**.
8. Manually run the pipeline once to test end-to-end:
   ```
   npx tsx scripts/ingest.ts --source=telegram
   npx tsx scripts/run-legitimacy-scoring.ts
   npx tsx scripts/process-new-jobs.ts
   ```
   Check the **Matches** page and your inbox.

## 5. Deploy (Vercel + GitHub Actions)

1. Push this repo to a GitHub repository you own.
2. Import it into [Vercel](https://vercel.com/new). Add the same env vars from `.env.local` in the Vercel project settings (Settings -> Environment Variables), with `NEXT_PUBLIC_APP_URL` set to your Vercel production URL. Deploy.
3. Add that same production URL + `/auth/callback` to Supabase's Redirect URLs (step 1.5 above).
4. In the GitHub repo -> **Settings -> Secrets and variables -> Actions**, add these repository secrets: `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_APP_URL` (your Vercel URL).
5. The `.github/workflows/ingest-telegram.yml` workflow runs every ~30 minutes automatically once these secrets exist. You can also trigger it manually from the repo's **Actions** tab ("Run workflow") to test it without waiting.

## What's implemented vs. stubbed

Only the **Telegram** source adapter is functional (scrapes public `t.me/s/<channel>` preview pages — no login needed). **Naukri, Wellfound, LinkedIn, and foundit** are wired into the UI and database but their adapters currently return zero results — see the comments at the top of each file in `lib/adapters/` for the intended approach and recommended build order (Wellfound -> Naukri -> foundit -> LinkedIn last, since LinkedIn is the most fragile/highest-ToS-risk to scrape). Adding one is a matter of implementing `fetchRaw`/`normalize` in that file; nothing else in the pipeline needs to change.

**Web push notifications** are not implemented in this pass (email only). Adding them later means: generate a VAPID key pair, add a subscribe button + service worker, and send via the `web-push` package (already installed) from `scripts/process-new-jobs.ts`.

**No autonomous auto-apply.** The app never logs into or submits forms on LinkedIn/Naukri/Wellfound/foundit — by design, since that violates their Terms of Service and risks your account. Every match ends at a real "Open apply link" you click yourself, with the CV and referral message already prepared.
