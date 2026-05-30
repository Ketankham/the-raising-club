-- 0001_core.sql
-- The Raising Club — core: extensions, enums, profiles, shared triggers.
-- Run order: 0001 -> 0002 -> 0003 -> 0004 -> 0005 -> 0006.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums (shared)
-- ---------------------------------------------------------------------------
create type user_role as enum ('parent', 'caregiver', 'organization', 'admin');

create type onboarding_status as enum ('in_progress', 'completed', 'abandoned');

-- Age bands. Onboarding screens use slightly different copy per role; this is
-- the superset used everywhere (caregiver profile uses the richer split).
create type age_group as enum (
  'infant',        -- 0–12 months
  'toddler',       -- 1–3 years
  'preschool',     -- 3–5 years
  'school_age',    -- 5–10 years (a.k.a. 5+ on some screens)
  'older_child',   -- 8–12 years
  'preteen',       -- 11+ / middle school
  'teen'           -- 13–18 years
);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles : 1:1 mirror of auth.users, holds role + shared identity fields.
-- ---------------------------------------------------------------------------
create table profiles (
  id                       uuid primary key references auth.users (id) on delete cascade,
  role                     user_role,                       -- null until role-select step
  first_name               text,
  last_name                text,
  preferred_name           text,                            -- "name children/families use"
  email                    text,
  phone                    text,
  zip_code                 text,
  avatar_url               text,
  locale                   text not null default 'en',
  -- Lifecycle timestamps (captured for EVERY role uniformly):
  registered_at            timestamptz,                     -- when a real account was created (email attached / anon converted); null while anonymous
  email_confirmed_at       timestamptz,                     -- mirror of auth.users.email_confirmed_at
  onboarding_completed_at  timestamptz,                     -- null => still onboarding
  created_at               timestamptz not null default now(), -- row creation (includes the anonymous draft)
  updated_at               timestamptz not null default now()
);

create index profiles_role_idx on profiles (role);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Auto-create a profile row whenever an auth user is created.
-- NOTE: anonymous sign-ins also create an auth.users row, so the profile is
-- created up-front and later filled in when the user converts to permanent.
create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, registered_at, email_confirmed_at)
  values (
    new.id,
    new.email,
    -- anonymous sign-ins have no email yet => not "registered" until they convert
    case when new.email is not null then now() end,
    new.email_confirmed_at
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- Sync auth lifecycle into profiles: email, email-confirmation date, and the
-- registration date (set the first time a real email is attached, i.e. when an
-- anonymous user converts to a permanent account).
create or replace function sync_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles p set
    email              = new.email,
    email_confirmed_at = new.email_confirmed_at,
    registered_at      = coalesce(p.registered_at, case when new.email is not null then now() end)
  where p.id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_updated
  after update of email, email_confirmed_at on auth.users
  for each row execute function sync_profile_from_auth();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;

-- A user can read/update only their own profile.
create policy profiles_select_own on profiles
  for select using (auth.uid() = id);

create policy profiles_update_own on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Admin helper: is the current user an admin? (SECURITY DEFINER avoids RLS recursion.)
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create policy profiles_admin_all on profiles
  for all using (is_admin()) with check (is_admin());
