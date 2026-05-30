# Go-live checklist — Supabase + deploy

The onboarding code is complete and builds. These are the steps **you** need to run
(they require your Supabase + Vercel accounts) before it works in production.

## 1. Create the Supabase project
- New project at https://supabase.com/dashboard
- **Auth → Providers/Settings → enable "Anonymous sign-ins"** ← required; the whole
  save-from-step-one model depends on it.
- (Optional) Auth → set the email confirmation redirect to `https://<domain>/auth/confirm`.

## 2. Apply the schema
```bash
cd web
supabase link --project-ref <your-ref>
supabase db push                 # runs migrations/0001 … 0007 in order
supabase gen types typescript --linked > src/types/database.ts   # optional but recommended
```
(Or paste each `supabase/migrations/000*.sql` into the SQL editor, in order.)

## 3. Environment variables
Local (`web/.env.local`) and Vercel (Project → Settings → Environment Variables):
```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```
For the abandoned-draft cleanup job (server-side only, never public):
```
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```

## 4. Schedule cleanup (optional)
Enable `pg_cron` and uncomment the `cron.schedule(...)` call at the bottom of
`migrations/0002_onboarding.sql`, or call `cleanup_abandoned_onboarding()` from a
scheduled Edge Function with the service role.

## 5. Deploy
- The app is **no longer a static export** — it's a server app (dynamic routes + proxy).
  Make sure Vercel build is the default `next build` (no `output: 'export'`). ✓ already.
- Connect the GitHub repo in Vercel (Settings → Git) and set the env vars above for
  Production + Preview.
- The Proxy **fails open** if env is missing, so a misconfigured deploy will not take the
  marketing pages down — but `/onboarding` needs Supabase to function.

## Smoke test after deploy
1. Visit `/onboarding` → role select → ways-to-use.
2. At the profile step, create an account → confirm it converts the anonymous user
   (same `auth.uid`) and sets `profiles.registered_at`.
3. Finish a flow → `profiles.onboarding_completed_at` set, typed tables populated.
4. Refresh mid-flow / log back in → lands on the saved step (resume).
5. Caregiver: pick "paid work" vs not → confirm the two different tracks.
