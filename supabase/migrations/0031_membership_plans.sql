-- 0031_membership_plans.sql
-- Lets a user record their chosen membership plan from the Settings page.
-- There is no payment integration yet (Stripe is schema-only): this simply
-- captures the plan the user selected. The plan KEY is validated server-side
-- against the role's catalog (src/lib/membership/plans.ts), so no DB-side enum
-- is needed and the catalog can evolve without a migration.
--
-- plan_key = null means the user is on their role's free starter plan.
-- RLS already allows a user to update their own profiles row (0001_core.sql),
-- and the price/plan is re-read & validated server-side, so no new policy needed.

alter table profiles
  add column if not exists plan_key         text,
  add column if not exists plan_interval    text not null default 'monthly',
  add column if not exists plan_selected_at  timestamptz;

-- Guard the interval values. Drop-then-add so re-running stays idempotent.
alter table profiles drop constraint if exists profiles_plan_interval_check;
alter table profiles
  add constraint profiles_plan_interval_check
  check (plan_interval in ('monthly', 'annual'));
