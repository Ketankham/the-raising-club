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
| `0019_courses_core.sql` | courses authoring: `courses` + chapters/modules/resources, revision questions/options, quizzes/quiz-questions/options (answers manager-only), `course_skills`, `course_certificate_config`, bundles (+items); `course_can_manage()`/`course_is_public()`; `course-assets` Storage bucket; seeds 8 categories + 4 approaches + starter skills. See `Reference-docs/Courses flow/COURSES-PLAN.md`. |
| `0020_courses_consumption.sql` | courses consumption: enrollments, module progress, revision answers (solved-once), quiz attempts (60% pass, unlimited), `certificates` (TRC-id + verify token). Server-side grading `submit_course_quiz()` issues cert + awards caregiver skills (`proof='trc_course'`); `course_quiz_for_taker()`/`course_quiz_review()` (reveal after pass); public `verify_certificate()`. |
| `0021_public_course_credentials.sql` | `public_caregiver_certificates(uid)` — SECURITY DEFINER, exposes a safe subset of a *published* caregiver's earned certificates (no verify token) so course credentials surface on the public profile / marketplace. Earned skills already read publicly. |
| `0022_courses_returning_rls_fix.sql` | **Fix**: admin create-course/bundle (INSERT … RETURNING via `.select()`) hit 42501 because the SELECT policy's `course_can_manage(id)` (STABLE) couldn't see the just-inserted row. SELECT policy now checks `created_by`/`is_admin()` directly. See `learnings.md`. |
| `0023_marketplace_family_listings.sql` | Marketplace "Connect Families": opt-in `family_listings` (1:1 parent, publish toggle: budget/schedule/care-needs/traits) + `family_listing_age_groups`/`_schedule`/`_open_to`/`_traits`, `family_traits` seed. New enums `schedule_window`, `family_open_to`. Published readable by any authed user. See `Reference-docs/Marketplace/MARKETPLACE-PLAN.md`. |
| `0024_marketplace_jobs.sql` | Marketplace jobs loop: `jobs` (parent/org-owned, `job_status`), `job_schedule`/`_age_groups`/`_skills`, `job_applications` (caregiver applies), `job_invitations` (co-hire modal). New enums `job_status`/`application_status`/`invitation_status`; `job_can_manage()`. Active jobs readable by any authed user; applicant/invitee/owner row access. |
| `0025_marketplace_saves_chat.sql` | `marketplace_saves` (heart on caregiver/family/job cards; `marketplace_target` enum) + Chat: `conversations`/`conversation_participants`/`messages` (1:1 direct), `is_conversation_participant()`, RPC `get_or_create_direct_conversation()`, last_message_at bump. Participant-gated RLS. |
| `0026_marketplace_cards.sql` | Browse-grid accessors (profiles/children are owner-only by RLS): `marketplace_caregiver_cards()` (published caregivers + safe identity, rating aggregate, skills, age groups, care settings) + `marketplace_family_cards()` (published family_listings + parent identity, budget, schedule, traits, children count, ages). Both SECURITY DEFINER, authenticated-only; app filters/sorts in JS like listEvents. |
| `0028_marketplace_chat_views.sql` | Chat inbox/thread accessors (peer name/avatar live on owner-only `profiles`): `marketplace_conversations()` (caller's conversations + peer(s) + last message + unread count) + `conversation_peers(cid)` (a thread's other participants, or null if not a member). Both SECURITY DEFINER. (Note: `0027_*` is the parallel caregiver-reviews feature; chat took 0028.) |
| `0032_notifications.sql` | Notifications: admin-managed `notification_types` catalog (in-app + email body templates, per-channel enable toggles, `{{token}}` vars, cc-admin), per-user `notifications` feed (owner-only RLS), `notification_emails` outbox (email PARKED — recorded as `skipped`). `render_template()` does `{{token}}` substitution; `create_notification()` (SECURITY DEFINER) is the single emit entry point; `mark_notifications_read()`. Seeds courses/events/marketplace/general types. See `Reference-docs/Notification/Notification-system-plan.md`. |

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
