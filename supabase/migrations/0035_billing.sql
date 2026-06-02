-- 0035_billing.sql
-- Billing ledger + denormalised entitlement snapshot.
--   * profiles gains the "active plan" fields that gate access (read in one place).
--   * user_plans is the canonical assignment ledger for BOTH Stripe subscriptions
--     (source='stripe') and manual comp grants (source='manual', admin start/end).
--   * recompute_entitlement() writes the snapshot from the active user_plans row.
--   * my_entitlement() reads the effective plan for the current user.
--
-- Subjects are polymorphic (user | household | org) via (subject_type, subject_id)
-- with no FK (ledger pattern). recompute_entitlement here handles 'user' and 'org';
-- 0036 REDEFINES it to add 'household' member fan-out once household_members exists.
-- Run order: 0034 -> 0035.

-- ---------------------------------------------------------------------------
-- profiles: entitlement snapshot (the "user field" guards read).
-- ---------------------------------------------------------------------------
alter table profiles
  add column if not exists stripe_customer_id text,
  add column if not exists active_plan_id     uuid references plans (id) on delete set null,
  add column if not exists plan_status        text not null default 'none',
  add column if not exists entitlement_until  timestamptz;

alter table profiles drop constraint if exists profiles_plan_status_check;
alter table profiles
  add constraint profiles_plan_status_check
  check (plan_status in ('none', 'active', 'trialing', 'past_due', 'canceled', 'comp'));

-- ---------------------------------------------------------------------------
-- user_plans: assignment ledger (Stripe + manual).
-- ---------------------------------------------------------------------------
create table user_plans (
  id                     uuid primary key default gen_random_uuid(),
  subject_type           text not null check (subject_type in ('user', 'household', 'org')),
  subject_id             uuid not null,
  plan_id                uuid not null references plans (id) on delete restrict,
  interval               text not null default 'monthly' check (interval in ('monthly', 'annual')),
  source                 text not null check (source in ('stripe', 'manual')),
  status                 text not null default 'active'
                           check (status in ('active','trialing','past_due','canceled','expired','scheduled','comp')),
  starts_at              timestamptz not null default now(),
  ends_at                timestamptz,                          -- manual comp end; null = open
  stripe_subscription_id text,
  stripe_customer_id     text,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  assigned_by            uuid references profiles (id) on delete set null,  -- admin (manual grants)
  notes                  text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index user_plans_subject_idx on user_plans (subject_type, subject_id);
create index user_plans_plan_idx on user_plans (plan_id);
create unique index user_plans_stripe_sub_idx on user_plans (stripe_subscription_id)
  where stripe_subscription_id is not null;
-- At most one "live" assignment per subject.
create unique index user_plans_one_active_idx on user_plans (subject_type, subject_id)
  where status in ('active', 'trialing', 'comp', 'past_due');

create trigger user_plans_set_updated_at
  before update on user_plans
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- recompute_entitlement: write the snapshot from the active assignment.
-- (0036 redefines to add household fan-out.)
-- ---------------------------------------------------------------------------
create or replace function recompute_entitlement(p_subject_type text, p_subject_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  up record;
  v_plan_id  uuid := null;
  v_status   text := 'none';
  v_until    timestamptz := null;
  v_interval text := null;
  v_customer text := null;
begin
  select * into up from user_plans u
    where u.subject_type = p_subject_type
      and u.subject_id = p_subject_id
      and u.status in ('active', 'trialing', 'comp', 'past_due')
      and u.starts_at <= now()
      and (u.ends_at is null or u.ends_at > now())
    order by u.created_at desc
    limit 1;

  if found then
    v_plan_id  := up.plan_id;
    v_status   := up.status;
    v_until    := coalesce(up.ends_at, up.current_period_end);
    v_interval := up.interval;
    v_customer := up.stripe_customer_id;
  end if;

  if p_subject_type = 'user' then
    update profiles set
      active_plan_id     = v_plan_id,
      plan_status        = v_status,
      entitlement_until  = v_until,
      plan_interval      = coalesce(v_interval, plan_interval),
      stripe_customer_id = coalesce(v_customer, stripe_customer_id)
    where id = p_subject_id;

  elsif p_subject_type = 'org' then
    update profiles set
      active_plan_id    = v_plan_id,
      plan_status       = v_status,
      entitlement_until = v_until
    where id in (
      select user_id from organization_members
      where org_id = p_subject_id and status = 'active'
    );
  end if;
  -- 'household' handled by the 0036 redefinition.
end;
$$;
grant execute on function recompute_entitlement(text, uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- my_entitlement: effective plan for the current user (reads own snapshot).
-- ---------------------------------------------------------------------------
create or replace function my_entitlement()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'planId',           p.active_plan_id,
    'planKey',          pl.key,
    'planName',         pl.name,
    'status',           coalesce(p.plan_status, 'none'),
    'interval',         p.plan_interval,
    'entitlementUntil', p.entitlement_until,
    'adultSeats',       pl.adult_seats,
    'staffSeats',       pl.staff_seats
  )
  from profiles p
  left join plans pl on pl.id = p.active_plan_id
  where p.id = auth.uid();
$$;
grant execute on function my_entitlement() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS — subject reads own; admin all; writes via service role / admin only.
-- (0036 adds a household-member read policy.)
-- ---------------------------------------------------------------------------
alter table user_plans enable row level security;

create policy user_plans_admin_all on user_plans
  for all using (is_admin()) with check (is_admin());

create policy user_plans_user_read on user_plans
  for select using (subject_type = 'user' and subject_id = auth.uid());

create policy user_plans_org_read on user_plans
  for select using (
    subject_type = 'org'
    and exists (
      select 1 from organization_members m
      where m.org_id = user_plans.subject_id and m.user_id = auth.uid() and m.status = 'active'
    )
  );
