-- 0022_courses_returning_rls_fix.sql
-- FIX: creating a course/bundle through the admin UI failed with
--   "new row violates row-level security policy for table courses" (42501).
--
-- Root cause: `createCourse` / `saveBundle` insert with `.select()` (PostgREST
-- `Prefer: return=representation`), i.e. INSERT ... RETURNING. The RETURNING row
-- is filtered by the SELECT policy. The old SELECT policy used
-- `course_can_manage(id)` / `course_bundle_can_manage(id)` — STABLE SECURITY
-- DEFINER functions that re-query the table by id. During INSERT ... RETURNING
-- the just-inserted row is NOT visible to that STABLE sub-select's snapshot, so
-- the function returns false, the creator cannot "read back" their new draft,
-- and Postgres raises 42501. (Plain INSERT with return=minimal worked fine.)
--
-- Fix: the SELECT policy checks the row's OWN `created_by` column + `is_admin()`
-- directly (snapshot-independent, no self-referential table lookup), instead of
-- the manage() function. Manage-by-org/creator semantics for UPDATE/DELETE are
-- unchanged (they operate on already-committed rows).
-- Run order: 0021 -> 0022.

drop policy if exists courses_public_read on courses;
create policy courses_public_read on courses
  for select using (
    status = 'published' or created_by = auth.uid() or is_admin()
  );

drop policy if exists course_bundles_read on course_bundles;
create policy course_bundles_read on course_bundles
  for select using (
    status = 'published' or created_by = auth.uid() or is_admin()
  );
