-- 0036_households.sql
-- Family households: a group that shares ONE family membership. The owner holds
-- the subscription; invited adults occupy seats counted against the active plan's
-- adult_seats limit. Mirrors the org/staff-invite pattern (0005/0016) but adds
-- plan-seat ENFORCEMENT at accept time. Invitations are copy-link (no SMTP).
--
-- Also REDEFINES recompute_entitlement() (from 0035) to fan the entitlement
-- snapshot out to every active household member, and adds a household read policy
-- to user_plans.
-- Run order: 0035 -> 0036.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table households (
  id            uuid primary key default gen_random_uuid(),
  name          text,
  owner_user_id uuid not null references profiles (id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index households_owner_idx on households (owner_user_id);
create trigger households_set_updated_at
  before update on households for each row execute function set_updated_at();

create table household_members (
  household_id   uuid not null references households (id) on delete cascade,
  user_id        uuid not null references profiles (id) on delete cascade,
  member_role    text not null default 'adult' check (member_role in ('owner', 'adult')),
  relation_label text,                                   -- "Co-parent", "Grandparent", …
  status         text not null default 'active' check (status in ('active', 'invited', 'removed')),
  joined_at      timestamptz not null default now(),
  primary key (household_id, user_id)
);
create index household_members_user_idx on household_members (user_id);

create table household_invitations (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references households (id) on delete cascade,
  email          text not null,
  invited_by     uuid references profiles (id) on delete set null,
  relation_label text,
  token          uuid not null default gen_random_uuid(),
  status         text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked')),
  expires_at     timestamptz not null default (now() + interval '14 days'),
  created_at     timestamptz not null default now(),
  accepted_at    timestamptz
);
create unique index household_inv_token_idx on household_invitations (token);
create index household_inv_household_idx on household_invitations (household_id);

-- ---------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER — avoid RLS recursion; mirror 0016).
-- ---------------------------------------------------------------------------
create or replace function household_for_user(uid uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select household_id from household_members
  where user_id = uid and status = 'active'
  order by joined_at limit 1;
$$;
grant execute on function household_for_user(uuid) to authenticated, service_role;

create or replace function is_household_member(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from household_members m
    where m.household_id = target and m.user_id = auth.uid() and m.status = 'active'
  );
$$;
grant execute on function is_household_member(uuid) to authenticated;

create or replace function is_household_owner(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from households h where h.id = target and h.owner_user_id = auth.uid());
$$;
grant execute on function is_household_owner(uuid) to authenticated;

-- Effective adult-seat limit for a household = active plan's adult_seats, else 1.
create or replace function household_seat_limit(target uuid)
returns integer language sql stable security definer set search_path = public as $$
  select coalesce((
    select pl.adult_seats
    from user_plans u join plans pl on pl.id = u.plan_id
    where u.subject_type = 'household' and u.subject_id = target
      and u.status in ('active','trialing','comp','past_due')
      and u.starts_at <= now() and (u.ends_at is null or u.ends_at > now())
    order by u.created_at desc limit 1
  ), 1);
$$;
grant execute on function household_seat_limit(uuid) to authenticated, service_role;

-- {limit, used, pending, available} for the invite UI. Members + owner count as used.
create or replace function household_seat_usage(target uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when is_household_member(target) or is_household_owner(target) or is_admin() then
    jsonb_build_object(
      'limit', household_seat_limit(target),
      'used', (select count(*) from household_members where household_id = target and status = 'active'),
      'pending', (select count(*) from household_invitations where household_id = target and status = 'pending' and expires_at > now()),
      'available', greatest(0, household_seat_limit(target)
        - (select count(*) from household_members where household_id = target and status = 'active')
        - (select count(*) from household_invitations where household_id = target and status = 'pending' and expires_at > now()))
    )
  else null end;
$$;
grant execute on function household_seat_usage(uuid) to authenticated;

-- Member list (name/email) for a member/owner — profiles is owner-only by RLS.
create or replace function household_members_list(target uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when is_household_member(target) or is_household_owner(target) or is_admin() then coalesce((
      select jsonb_agg(jsonb_build_object(
        'userId', p.id,
        'name', coalesce(p.preferred_name, p.first_name, p.email),
        'email', p.email,
        'role', m.member_role,
        'relationLabel', m.relation_label,
        'status', m.status
      ) order by m.joined_at)
      from household_members m join profiles p on p.id = m.user_id
      where m.household_id = target and m.status = 'active'
    ), '[]'::jsonb)
  else null end;
$$;
grant execute on function household_members_list(uuid) to authenticated;

-- Accept an invitation: validate, ENFORCE SEAT LIMIT, add member, recompute.
create or replace function accept_household_invitation(invite_token uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  inv record;
  uid uuid := auth.uid();
  active_members int;
  seat_limit int;
begin
  if uid is null then return null; end if;
  select * into inv from household_invitations
    where token = invite_token and status = 'pending' and expires_at > now();
  if not found then return null; end if;

  -- Already a member? Just return the household.
  if exists (select 1 from household_members where household_id = inv.household_id and user_id = uid and status = 'active') then
    update household_invitations set status = 'accepted', accepted_at = now() where id = inv.id;
    return inv.household_id;
  end if;

  seat_limit := household_seat_limit(inv.household_id);
  select count(*) into active_members from household_members
    where household_id = inv.household_id and status = 'active';
  if active_members >= seat_limit then
    return null;  -- seats full; caller surfaces an upgrade prompt
  end if;

  insert into household_members (household_id, user_id, member_role, relation_label, status)
    values (inv.household_id, uid, 'adult', inv.relation_label, 'active')
    on conflict (household_id, user_id) do update set status = 'active';

  update household_invitations set status = 'accepted', accepted_at = now() where id = inv.id;
  perform recompute_entitlement('household', inv.household_id);
  return inv.household_id;
end;
$$;
grant execute on function accept_household_invitation(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- recompute_entitlement: REDEFINE to add household fan-out (keeps user/org).
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
      active_plan_id = v_plan_id, plan_status = v_status, entitlement_until = v_until
    where id in (select user_id from organization_members where org_id = p_subject_id and status = 'active');

  elsif p_subject_type = 'household' then
    update profiles set
      active_plan_id    = v_plan_id,
      plan_status       = v_status,
      entitlement_until = v_until,
      plan_interval     = coalesce(v_interval, plan_interval)
    where id in (select user_id from household_members where household_id = p_subject_id and status = 'active');
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table households            enable row level security;
alter table household_members     enable row level security;
alter table household_invitations enable row level security;

-- households: members read; owner writes; admin all. (snapshot-independent
-- predicate on owner so INSERT … RETURNING works for the creator.)
create policy households_owner_rw on households
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy households_member_read on households
  for select using (is_household_member(id) or is_admin());
create policy households_admin_all on households
  for all using (is_admin()) with check (is_admin());

-- members: a member reads the roster; the owner manages; admin all.
create policy hm_member_read on household_members
  for select using (is_household_member(household_id) or is_household_owner(household_id) or is_admin());
create policy hm_owner_write on household_members
  for all using (is_household_owner(household_id) or is_admin())
  with check (is_household_owner(household_id) or is_admin());
-- A user may insert/maintain their OWN membership row (used by accept flow fallbacks).
create policy hm_self on household_members
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- invitations: owner/admin manage. (invitee path is the SECURITY DEFINER RPC.)
create policy hi_owner_rw on household_invitations
  for all using (is_household_owner(household_id) or is_admin())
  with check (is_household_owner(household_id) or is_admin());

-- user_plans: household members can read their household's billing row.
create policy user_plans_household_read on user_plans
  for select using (subject_type = 'household' and is_household_member(subject_id));
