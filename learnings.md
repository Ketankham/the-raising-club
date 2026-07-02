# Learnings & Gotchas — The Raising Club

A running checklist of hard-won lessons. Intended to grow into a pre-flight
checklist / pre-commit hook. Each entry: **symptom → root cause → fix → guardrail.**

---

## 1. RLS: `INSERT ... RETURNING` fails with 42501 even though the INSERT is allowed

**Symptom**
- Creating a row through the app fails: `new row violates row-level security
  policy for table "X"` (Postgres code `42501`), HTTP 403.
- The user is correctly authenticated (`auth.uid()` is right, `is_admin()` true).
- It is **intermittent by table**: an old table works, a new one fails with the
  same policy pattern.

**How to confirm it's the RETURNING, not the INSERT**
- Repeat the insert with `Prefer: return=minimal` → **succeeds** (201).
- Repeat with `Prefer: return=representation` (what supabase-js `.insert().select()`
  does) → **fails** (403).
- → The INSERT passes WITH CHECK; the failure is the **SELECT (read) policy**
  applied to the `RETURNING` row.

**Root cause**
- The SELECT/read policy used a **STABLE `SECURITY DEFINER` helper** that
  *re-queries the same table by id* (e.g. `course_can_manage(id)` doing
  `select … from courses where id = target`).
- During `INSERT … RETURNING`, the just-inserted row is **not visible to that
  STABLE function's snapshot**, so it returns `false`; the creator "can't read
  back" their own new row → 42501.

**Fix**
- In the **read policy**, check the row's **own columns** + claim-based helpers
  directly (snapshot-independent), not a self-referential table lookup:
  ```sql
  -- BAD (self-referential, breaks INSERT...RETURNING for the creator):
  using ( status = 'published' or course_can_manage(id) )
  -- GOOD:
  using ( status = 'published' or created_by = auth.uid() or is_admin() )
  ```
- Manage-by-function (`*_can_manage`) is fine for UPDATE/DELETE (they act on
  already-committed rows) — only the **SELECT used by RETURNING** is sensitive.
- Reference fix: `web/supabase/migrations/0022_courses_returning_rls_fix.sql`.

**Guardrail / checklist**
- [ ] Any table whose rows are created via `.insert().select()` /
      `.upsert().select()` MUST have a SELECT policy that the **creator passes
      using row-own columns** (`created_by = auth.uid()` / `is_admin()`), not a
      `*_can_manage(id)` self-lookup.
- [ ] When adding a new owner-writable table, smoke-test create through the real
      API (`Prefer: return=representation`), not just raw SQL.

---

## 2. Raw `psql`/`pg` tests can hide RLS bugs (superuser nuance)

**Symptom**
- A raw insert via the `postgres` (service) connection succeeds, but the same
  insert via the REST API / app fails RLS.

**Root cause**
- `postgres` is a superuser and bypasses RLS. Even after `SET ROLE authenticated`,
  it's easy to *think* you're testing RLS when you're not.

**Fix / how to test RLS faithfully from a script**
```sql
begin;
set local role authenticated;                              -- drop superuser
select set_config('request.jwt.claims',
  json_build_object('sub', '<user-uuid>', 'role','authenticated')::text, true);
-- ...do the insert/select...
rollback;
```
- **Validate the harness**: set the policy's check to `false` and confirm the
  insert is **BLOCKED**. If it still succeeds, RLS is being bypassed and your
  test is meaningless.
- Best of all: reproduce against the **real PostgREST** by signing in via
  `/auth/v1/token?grant_type=password` and calling `/rest/v1/<table>` with the
  returned `access_token` (this is exactly what the app does).

**Guardrail / checklist**
- [ ] For any RLS assertion in a script, include a negative control
      (`check(false)` ⇒ blocked) before trusting positive results.

---

## 3. Supabase SSR auth: how to debug "auth lost in a Server Action"

We chased a red herring here — writes failing while reads worked looked like a
session/refresh bug. It was actually #1. Useful debugging recipe regardless:

- **Decode the actual outgoing token** by passing a logging `fetch` to
  `createServerClient({ global: { fetch } })` and base64-decoding the
  `Authorization: Bearer` JWT payload (`sub`, `role`, `exp - now`). Confirms
  whether each REST call is authed and with which token.
- **Confirm what the DB sees** with a throwaway `SECURITY DEFINER` probe:
  ```sql
  create function whoami() returns jsonb language sql stable security definer
  set search_path=public as $$
    select jsonb_build_object('uid', auth.uid(), 'is_admin', is_admin(),
                              'jwt_role', auth.jwt() ->> 'role') $$;
  ```
  Call it via `supabase.rpc('whoami')` in the failing action. (Drop it after.)
- Server-side Supabase clients should not run their own token refresh; the
  proxy (`updateSession` in `src/lib/supabase/middleware.ts`) owns refresh. (We
  tried `auth: { autoRefreshToken:false, persistSession:false }` — harmless, but
  it was NOT the fix here.)

**Guardrail / checklist**
- [ ] Before blaming auth/session for a write failure, check the **error code**:
      `42501` = RLS policy, not auth. Decode the JWT + run `whoami()` to confir
      auth is actually fine, then look at the policy (esp. SELECT-on-RETURNING, #1).

---

## 4. PostgREST schema cache vs live RLS

- DDL applied via a **direct pg connection** (our `scripts/apply-migrations.mjs`)
  is picked up by PostgREST via the `pgrst_ddl_watch` event trigger (present on
  this project) — but if in doubt, force a reload:
  `notify pgrst, 'reload schema';` (and `'reload config'`).
- **Important:** the PostgREST schema cache does **not** change *RLS enforcement*
  (Postgres enforces policies live). So a 42501 is never "just a stale cache" —
  look at the actual policy logic (#1).

---

## 5. `pg` is installed `--no-save`; npm installs prune it

- `pg` (used by `web/scripts/*.mjs`) is intentionally not in `package.json`.
- Any `npm install <pkg>` (e.g. adding Tiptap, qrcode) **prunes** it. If a script
  dies with `ERR_MODULE_NOT_FOUND: pg`, run `npm install --no-save pg` again.

**Guardrail / checklist**
- [ ] After any `npm install`, if you're about to run a `scripts/*.mjs`, re-add
      `pg`: `npm install --no-save pg`.

---

## 6. Testing writes through the UI needs a real, confirmed login

- Throwaway logins for Playwright/manual testing:
  `web/scripts/make-test-users.mjs` → a test **admin** + a published test
  **caregiver** (password `TestPass#2026`). Created by direct insert into
  `auth.users` (bcrypt) + `auth.identities`, email pre-confirmed, so
  `signInWithPassword` works immediately.
- The shared MCP Chrome profile can hold **stale cookies** from a parallel
  session — sign out / sign in fresh if behavior looks off (though a fresh prod
  build on a separate port is the cleaner isolation).

---

## 7. Verifying a build without disturbing the dev server

- A long-running `next dev` on :3000 may be someone else's. To test a fix in
  isolation: `npm run build` then `npx next start -p 3100` and point the browser
  at :3100. Server-only file changes (e.g. `lib/supabase/server.ts`) are picked
  up reliably by a fresh build, less reliably by dev HMR.

---

## 8. Component refactoring mid-commit causes partial state and build failures

**Symptom**
- A component is partially refactored for i18n (code structure changed but references
  not fully updated). Local build passes but Vercel deployment fails with type errors.
- Error: `Cannot find name 'FEATURES_CONFIG'. Did you mean 'FEATURES'?` even though
  the component was supposedly "reverted" with `git checkout`.
- The component has both old (hardcoded FEATURES array) and new (FEATURES_CONFIG)
  code simultaneously, causing undefined references.

**Root cause**
- Started refactoring `src/components/landing/features.tsx` for i18n support:
  renamed `FEATURES` → `FEATURES_CONFIG`, added `useTranslations()`, updated rendering.
- Realized translation keys weren't ready; tried to revert with `git checkout` but
  the file wasn't fully reverted — the changes remained partially applied.
- Committed code with both old and new state mixed together, breaking references.
- `npm run build` (possibly cached) passed locally but Vercel's fresh build caught it.

**Fix**
- Fully revert the component to its last known-good state using:
  ```bash
  git show HEAD~N:src/components/landing/features.tsx > /tmp/original.tsx
  cat /tmp/original.tsx  # Verify it's correct
  cp /tmp/original.tsx src/components/landing/features.tsx
  npm run build  # Verify build passes
  git add && git commit
  ```
- Do NOT partially commit refactored components. If you refactor, complete the refactor
  OR fully revert. No half-finished state.

**Guardrail / checklist**
- [ ] When refactoring a component structure (imports, exports, prop names), do NOT
      commit until the entire refactoring is complete and all references are updated.
- [ ] If starting a major refactor (e.g. adding i18n to a component), ensure all
      translation keys are ready BEFORE you start changing code.
- [ ] After any component refactoring, run `npm run build` locally BEFORE pushing.
      Trust the build output, not the dev server (HMR may mask issues).
- [ ] If reverting a component with `git checkout`, verify the result with:
      `cat src/components/foo.tsx` to confirm the old code is actually there.
- [ ] Use `git diff` before committing refactored components to spot mixed old/new code.

---

## 10. i18n namespace path must match JSON structure exactly

**Symptom**
- Page shows untranslated key paths as literal text (e.g., `about.manifesto.heroTitle`)
- Keys exist in messages files but aren't resolved
- useTranslations() doesn't error, just returns the key path as fallback

**Root cause**
- Used wrong namespace path: `useTranslations("landing.manifesto")`
- Actual JSON structure has manifesto under top-level `about`, not `landing`
- next-intl doesn't throw errors for missing namespaces — it returns the key path as the translated string

Example:
```json
{
  "landing": { "hero": {...}, "cta": {...} },
  "about": { "hero": {...}, "manifesto": {...} }
}
```
✗ **Wrong**: `useTranslations("landing.manifesto")` → shows `landing.manifesto.heroTitle`
✅ **Correct**: `useTranslations("about.manifesto")` → shows translated value

**Fix**
- Use Node.js to validate JSON structure: `node -e "const j = JSON.parse(require('fs').readFileSync('messages/en.json', 'utf8')); console.log(Object.keys(j))"`
- Verify namespace hierarchy before calling useTranslations()
- After adding keys to messages file, verify they're in the expected location with JSON parsing

**Guardrail / checklist**
- [ ] When wiring a new component for i18n, first validate the JSON structure contains your namespace
- [ ] Don't assume nested structure from code organization — follow the actual JSON hierarchy
- [ ] Test with `node -e` to verify keys exist at the path you're using in useTranslations()
- [ ] Remember: next-intl returns the key path itself as the "translation" when namespace/key doesn't exist (no error thrown)

---

## 9. Untracked imported files cause silent local-only build failures

**Symptom**
- Local build passes (`npm run build` succeeds)
- Vercel production build fails with `Module not found` or `Cannot find module`
- Error only appears on Vercel, never locally
- The missing file IS on disk locally (so local builds work) but was never committed to git

**Root cause**
- A component file or module was created but left untracked in git (not in `git add` or `.gitignore`)
- Another file (already committed) imports from this untracked file
- Local build succeeds because the file exists on disk
- Vercel's build fails because it only has the committed git tree (no untracked files)
- Example: committed `marketplace/applicants/[applicationId]/page.tsx` which imports
  `@/components/marketplace/applicant-actions.tsx`, but the component file was never staged/committed

**Fix**
```bash
# Check for untracked files that should be in git
git status  # Look for "Untracked files"

# Stage and commit the missing files
git add src/components/marketplace/applicant-actions.tsx
git commit -m "Add missing imported component file"
git push origin main
```

**Guardrail / checklist**
- [ ] Before pushing/deploying, run `git status` and ensure no imported files are untracked
- [ ] Pay special attention to newly created component files — they must be `git add`-ed
- [ ] If a file exists on disk but not in git, the build will pass locally but fail on Vercel
- [ ] Use `npm run build` before committing to catch missing imports (though local files may mask the issue)
- [ ] A good CI check: `git ls-files | grep -c .` and `find . -type f -name "*.tsx" | wc -l` 
  should be similar (files on disk ≈ tracked files, allowing for .gitignore)

---

## 11. External webhook routes must live outside `[locale]`

**Symptom**
- Webhook receiver appears to work (200 response in theory), but no data ever arrives — admin panel stays empty, no DB rows created.

**Root cause**
- Route was at `src/app/[locale]/api/webhooks/authenticate/route.ts`, making its live URL `/en/api/webhooks/authenticate`.
- Authenticate (and Stripe, etc.) POST to `/api/webhooks/authenticate` — no locale prefix → **404** → Authenticate retries, gets 404 again, stops → no data.

**Fix**
- Moved to `src/app/api/webhooks/authenticate/route.ts` (outside `[locale]`).
- Stripe webhook was already correctly at `src/app/api/stripe/webhook/route.ts`.

**Rule:** Any route called by an external service (webhook, OAuth callback, payment provider) → `src/app/api/<path>/route.ts`. Never inside `[locale]`.

---

## 12. Authenticate webhook URL must be registered in their dashboard

**Symptom**
- Webhook route is correct, AUTHENTICATE_WEBHOOK_SECRET matches, but still no events arrive.

**Root cause**
- Authenticate doesn't know your URL. You must register it in the Authenticate dashboard → Webhooks section.

**URLs to register:**
- Staging: `https://the-raising-club-staging.vercel.app/api/webhooks/authenticate`
- Production: `https://theraisingclub.com/api/webhooks/authenticate`

Set `AUTHENTICATE_WEBHOOK_SECRET` to match the secret shown in the Authenticate dashboard. If the env var is unset, the route accepts all requests (useful for initial testing, but set it for production).

---

## 13. Authenticate `/user/create` requires DOB in DD-MM-YYYY

**Symptom**
- `startVerification` fails with "Could not start verification" — underlying Authenticate API error: "dob required" or 400.

**Root cause**
- Authenticate `/user/create` requires `dob` in **DD-MM-YYYY** format. HTML date inputs and Postgres `date` columns store **YYYY-MM-DD**.

**Fix**
```ts
const toApiFormat = (d: string) => {
  const [y, m, day] = d.split('-');
  return `${day}-${m}-${y}`;
};
```
DOB is stored in `caregiver_profiles.date_of_birth` as a proper `date` (ISO), converted only at call time. Saved on first attempt so retries don't re-ask the user.

---

## 14. Authenticate Medallion — correct endpoint is `POST /user/jwt`, not `/user/medallion/link`

**Symptom**
- `getMedallionUrl` throws 404.

**Fix**
- Call `POST /user/jwt` with `{ userAccessCode }` → returns `{ token, jwt }`.
- Redirect URL: `https://verify.authenticating.com/?token=${token}`.
- `/user/medallion/link` is documented in some older guides but returns 404.

---

## 15. PostgREST PGRST201 — two FKs from the same table to the same target

**Symptom**
- `listVerifications` query returns 0 rows; Vercel logs show `PGRST201 Could not embed because more than one relationship was found`.

**Root cause**
- Migration 0043 added `reviewed_by uuid references profiles(id)` alongside the existing `user_id uuid references profiles(id)`. PostgREST can't decide which FK to use for a bare `profiles!inner(...)` join.

**Fix**
```ts
.select('..., profiles!verifications_user_id_fkey!inner(...)')
```
Always name the FK explicitly when a table has multiple FKs to the same target. FK names follow the pattern `{table}_{column}_fkey`.

---

## 16. `SUPABASE_SERVICE_ROLE_KEY` is encrypted — cannot be pulled locally

**Symptom**
- `vercel env pull` runs, `.env.local` is updated, but `process.env.SUPABASE_SERVICE_ROLE_KEY` is empty string.
- Admin client queries (`createAdminClient()`) return null locally.

**Root cause**
- Vercel marks this secret as encrypted/sensitive. `env pull` returns empty string for encrypted vars.

**Workaround**
- Test anything requiring service-role against deployed staging only. Add `createAdminClient()!` (non-null assertion) in server-only code where the key is guaranteed to exist on Vercel.
- Never import `src/lib/supabase/admin.ts` into client bundles — it's `server-only`.

---

## 17. Test verification rows from the seed script have no metadata or reference

The 3 verification rows for `mkt-demo-maya`, `mkt-demo-aiko`, `mkt-demo-camille` were inserted directly by `scripts/record-verify-flow.mjs` with `reference = null` and `metadata = null`. They are **not real webhook results**.

Real results (from actual Authenticate webhooks) will have:
- `reference = userAccessCode`
- `metadata.idDocument` — extracted doc fields (name, DOB, nationality, gender, doc type)
- `metadata.rawStatus` and `metadata.rawResult`

Do not use the demo rows to validate the admin panel's data display — use the QA caregiver account and a real Medallion flow.

---

## 18. Always apply migrations before deploying code that uses their new columns

If code references a new column (e.g. `risk_score`) but the migration hasn't been applied, DB queries fail silently or return wrong data.

```bash
# Apply pending migrations before or immediately after deploying
node --env-file=.env.local scripts/apply-migrations.mjs 0046
# Then reload PostgREST schema cache:
node --env-file=.env.local scripts/reload-schema.mjs
```
