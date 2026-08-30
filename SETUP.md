# Setup

Everything below happens in accounts you control — nothing here can be created on your behalf. Work through it top to bottom; each section says exactly what to click/copy.

## 1. Supabase (database, auth, CV storage)

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine, no card required). Set a database password when prompted — save it somewhere, you'll need it in step 4.
2. **Project Settings -> API**: copy the "Project URL" and the `anon` `public` key -> these become `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Same page: copy the `service_role` key (keep secret, never expose client-side) -> `SUPABASE_SERVICE_ROLE_KEY`.
4. Connection string: click the **Connect** button (top of the project dashboard, next to the project name — Supabase moved this out of Project Settings, so don't go looking for a "Database" entry in Settings). In the dialog, select **Transaction pooler** (not "Direct connection") and copy the URI. Use the transaction pooler specifically, not direct connection — direct connections are IPv6-only and will silently fail to resolve from IPv4-only environments like GitHub Actions runners; the pooler works everywhere. Replace `[YOUR-PASSWORD]` in the copied string with your database password -> `DATABASE_URL`.
5. **Authentication -> Providers**: confirm "Email" is enabled. **Authentication -> URL Configuration**: add `http://localhost:3000/auth/callback` (and later your production URL + `/auth/callback`) to Redirect URLs.
6. **Storage**: create a new bucket named exactly `cvs`. Leave it private (not public) — the app generates short-lived signed URLs to serve downloads. A private bucket has **no access policies by default** — without the next step, every upload fails with "new row violates row-level security policy". Open the **SQL Editor** and run:
   ```sql
   create policy "cvs_insert_own" on storage.objects for insert to authenticated
     with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
   create policy "cvs_select_own" on storage.objects for select to authenticated
     using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
   create policy "cvs_delete_own" on storage.objects for delete to authenticated
     using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
   ```
   This matches the app's upload path convention (`<user id>/<filename>`) so each user can only read/write/delete their own files.

## 2. Anthropic API key

Create a key at [console.anthropic.com](https://console.anthropic.com) -> `ANTHROPIC_API_KEY`. Used for parsing messy job text and scam/legitimacy scoring (`claude-haiku-4-5`). At personal-project volume this should cost well under $1/month.

## 3. Resend (email)

Create an account at [resend.com](https://resend.com) and an API key -> `RESEND_API_KEY`. For real use, verify a sending domain (Resend -> Domains) and set `RESEND_FROM_EMAIL` to an address on it; for quick testing you can leave the default `onboarding@resend.dev` sender, which only delivers to the email you signed up with.

## 4. Web push (VAPID keys)

No account needed — generate a keypair locally:
```
node -e "console.log(require('web-push').generateVAPIDKeys())"
```
Set `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` from the output, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` to the same public key value, and `VAPID_SUBJECT` to `mailto:` + your email (required by the push spec so push services can contact you if something's wrong). The private key must never be exposed client-side or committed.

## 5. Local development

1. Copy `.env.local.example` to `.env.local` and fill in everything from steps 1-3, plus `NEXT_PUBLIC_APP_URL=http://localhost:3000`.
2. `npm install`
3. Push the schema to your Supabase database: `npx drizzle-kit push` (schema.ts declares a stub `auth.users` table purely so Drizzle can add foreign keys to it — Supabase already owns that table, and the checked-in migration has the stub's own `CREATE TABLE` stripped out; if you ever regenerate migrations from a schema change, re-check the new SQL file for a stray `CREATE TABLE "auth"."users"` and delete it before applying)
4. Seed the company whitelist: `npx tsx scripts/seed.ts`
5. `npm run dev`, open `http://localhost:3000`, sign in with your email (magic link).
6. Add a Telegram source directly in the database — there's no in-app UI for this by design (picking/vetting a channel is a judgment call, not something to hand a non-technical user a raw JSON form for). Run this once you have a public channel's username (no `@`):
   ```sql
   insert into job_sources (type, name, config, enabled, poll_interval_minutes)
   values ('telegram', 'My channel', '{"channel": "the_channel_username"}', true, 30);
   ```
   via the Supabase SQL Editor, or with `psql "$DATABASE_URL" -c "..."` / any Postgres client using the connection string from step 1.4.
7. Fill in your **Profile**, upload a **CV**, add a default **Referral template**. On **Settings**, click "Enable push notifications on this device" if you want browser push alongside email — it'll ask for notification permission.
8. Manually run the pipeline once to test end-to-end:
   ```
   npx tsx scripts/ingest.ts --source=telegram
   npx tsx scripts/run-legitimacy-scoring.ts
   npx tsx scripts/process-new-jobs.ts
   npx tsx scripts/send-daily-digest.ts
   ```
   Check the **Matches** page (new ones show a red dot until opened, and the sidebar bell badges the total) and your inbox.

## 6. Deploy (Vercel + GitHub Actions)

1. Push this repo to a GitHub repository you own.
2. Import it into [Vercel](https://vercel.com/new). Add the same env vars from `.env.local` in the Vercel project settings (Settings -> Environment Variables), with `NEXT_PUBLIC_APP_URL` set to your Vercel production URL. Deploy.
3. Add that same production URL + `/auth/callback` to Supabase's Redirect URLs (step 1.5 above).
4. In the GitHub repo -> **Settings -> Secrets and variables -> Actions**, add these repository secrets: `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_APP_URL` (your Vercel URL), `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
5. Two scheduled workflows run automatically once these secrets exist: `.github/workflows/ingest-telegram.yml` (every ~3 hours — ingest, score, match, instant push) and `.github/workflows/daily-digest.yml` (once a day at 09:00 IST — the one summary email). Trigger either manually from the repo's **Actions** tab ("Run workflow") to test without waiting.

## What's implemented vs. stubbed

Only the **Telegram** source adapter is functional (scrapes public `t.me/s/<channel>` preview pages — no login needed). **Naukri, Wellfound, LinkedIn, and foundit** are stubbed in `lib/adapters/` and currently return zero results — see the comments at the top of each file for the intended approach and recommended build order (Wellfound -> Naukri -> foundit -> LinkedIn last, since LinkedIn is the most fragile/highest-ToS-risk to scrape). Sources are added directly in the database (§5.6 above), not through the app UI. Adding an adapter is a matter of implementing `fetchRaw`/`normalize` in that file; nothing else in the pipeline needs to change.

**Web push notifications are implemented** (Phase 2) — above-threshold matches fire an instant push (title/company + deep link) to any device where the user clicked "Enable push notifications" on Settings, plus a red badge on the sidebar bell and a red dot on the posting itself until it's opened.

**Email is a single daily digest, not per-match.** `scripts/process-new-jobs.ts` only creates matches and fires instant push; it never sends email. `scripts/send-daily-digest.ts` runs once a day and sends exactly one email per user covering every match (any salary bucket) that doesn't already have an email notification recorded — so it's safe to run more than once without double-emailing.

**Duplicate postings are deduped at the job level.** Channels commonly repost the identical opportunity as a separate message (a "pinned" wrapper plus a plain duplicate) — each gets its own Telegram message id, so the raw-message uniqueness check doesn't catch it. `jobs.dedupe_hash` (normalized company + title) does.

**No autonomous auto-apply.** The app never logs into or submits forms on LinkedIn/Naukri/Wellfound/foundit — by design, since that violates their Terms of Service and risks your account. Every match ends at a real "Open apply link" you click yourself, with the CV and referral message already prepared.
