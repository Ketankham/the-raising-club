-- 0030_events_returning_rls_fix.sql
-- FIX: creating an event through the admin/org UI failed with
--   "new row violates row-level security policy for table events" (42501),
-- for org owners AND admins. All existing events were seeded (created_by null),
-- so UI creation had never actually worked.
--
-- Root cause (identical to courses, see learnings.md #1 / migration 0022):
-- `createEvent` inserts with `.select()` (PostgREST `Prefer: return=representation`,
-- i.e. INSERT ... RETURNING). The RETURNING row is filtered by the SELECT policy.
-- The old `events_public_read` SELECT policy used `event_can_manage(id)` — a STABLE
-- SECURITY DEFINER function that re-queries `events` by id. During INSERT ... RETURNING
-- the just-inserted draft is NOT visible to that STABLE sub-select's snapshot, so the
-- function returns false, the creator cannot read back their new draft, and Postgres
-- raises 42501. (A plain insert with return=minimal — e.g. event_saves — worked fine.)
--
-- Fix: the SELECT policy checks the row's OWN columns + claim-based helpers directly
-- (snapshot-independent), instead of the self-referential `event_can_manage(id)`.
-- `is_org_admin(org_id)` is safe here: it queries organization_members, not events.
-- UPDATE/DELETE keep using event_can_manage (they act on already-committed rows).
-- Run order: 0029 -> 0030.

drop policy if exists events_public_read on events;
create policy events_public_read on events
  for select using (
    (visibility = 'public' and status in ('published','full','completed'))
    or created_by = auth.uid()
    or (org_id is not null and is_org_admin(org_id))
    or is_admin()
  );

-- Same RETURNING bug on ORGANIZATIONS, surfaced during onboarding:
-- `promoteOnboardingData` inserts the org with `.select()` (INSERT ... RETURNING),
-- but the org membership row is inserted AFTER the org. At RETURNING time the
-- read policy `is_org_member(id)` finds no membership yet → the owner cannot read
-- back their just-created org → 42501, and onboarding completion fails. Fix: let
-- the owner read via the row-own `owner_user_id` column (snapshot-independent).
drop policy if exists orgs_member_read on organizations;
create policy orgs_member_read on organizations
  for select using (
    is_org_member(id) or owner_user_id = auth.uid() or is_admin()
  );
