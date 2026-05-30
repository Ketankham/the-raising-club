# Supabase migrations — The Raising Club

Schema for the onboarding flow + the four user roles. See the full design rationale in
`Reference-docs/The onboarding flow/ONBOARDING-AND-SCHEMA-PLAN.md`.

## Run order
| File | Contents |
|------|----------|
| `0001_core.sql` | extensions, shared enums, `profiles` (1:1 with `auth.users`), signup trigger, `is_admin()`, `set_updated_at()` |
| `0002_onboarding.sql` | `onboarding_progress` (resume state-machine) + `cleanup_abandoned_onboarding()` |
| `0003_parent.sql` | `parent_profiles`, `children` |
| `0004_caregiver.sql` | caregiver hub + taxonomy + community track + reviews + verifications |
| `0005_organization.sql` | `organizations`, members, locations, job posts, applications, staff invites |
| `0006_platform.sql` | admin invitations, audit log, feature flags |
| `0007_seed_taxonomy.sql` | caregiver skill-section taxonomy + initial feature flags |
| `0008_public_profile.sql` | public caregiver profile (SECURITY DEFINER limited view) |
| `0009_admin_users.sql` | soft-deactivation + general user invitations |
| `0010_public_profile_active.sql` | public-profile active flag refinements |
| `0011_org_about.sql` | organization about/profile fields |
| `0012_org_public_profile.sql` | public organization profile |
| `0013_events_core.sql` | events catalog: `events`, sessions, locations, instructors, resources, categories (+map), waivers, invitations; `event_can_manage()` + category seed. (Course links + membership-tier gating deferred — events open to all.) |
| `0014_events_registration.sql` | participants/payments: registrations, registration-children (capacity by child), `child_safety_profiles` (staff-gated), pickups/emergency contacts, waiver acceptances, Stripe payments + refunds + credits, reminders |
| `0015_events_figma_additions.sql` | additive from Figma: `events.is_featured` + `events.agenda`, `event_saves` (save-for-later), `event_resources` file support (`file` kind + `file_path`, `url` now nullable) |
| `0017_event_messages.sql` | two-way event messaging: `event_messages` (one thread per registration; RLS by registrant owner or event manager) |
| `0018_event_host_name.sql` | `events.host_name` — denormalized organizer display name (org/company name, else creator) for list + detail "Hosted by" |

## Apply
With the Supabase CLI (recommended):
```bash
# from web/
supabase link --project-ref <ref>
supabase db push           # applies everything in supabase/migrations in order
supabase gen types typescript --linked > src/types/database.ts
```
Or paste each file, in order, into the Supabase SQL editor.

## Notes
- RLS is enabled on every table; policies are colocated in each file.
- Anonymous onboarding relies on Supabase **Anonymous Sign-ins** (enable in
  Auth settings). The anon user is upgraded in place at the profile step, so the
  `auth.uid` — and all saved progress — is preserved.
- `cleanup_abandoned_onboarding()` should run from pg_cron or a scheduled Edge
  Function with the service role (purges never-converted anon drafts > 14 days).
- These files are written for Postgres 15 / Supabase and have been structurally
  reviewed; apply to a dev project and run `supabase db lint` before production.
