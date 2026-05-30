-- 0003_parent.sql
-- Parent / Guardian role data.

-- Parent goals (Screen "What brings you here right now?")
create type parent_intent as enum (
  'find_care',           -- looking for care for my child
  'connect_families',    -- connect with other families nearby
  'events',              -- join or host events and activities
  'learn',               -- learn about child development / routines
  'guidance_team'        -- already have childcare, want guidance for family + care team
);

create table parent_profiles (
  user_id     uuid primary key references profiles (id) on delete cascade,
  -- "What does your child call you?" (Mom, Dad, Abuela, Tito, nickname, ...)
  child_term  text,
  intents     parent_intent[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger parent_profiles_set_updated_at
  before update on parent_profiles
  for each row execute function set_updated_at();

-- Children are always saved AGAINST A USER (the parent who owns the account).
-- We store ONLY: birth month, birth year, and a pet name (nickname).
-- PRIVACY: no full/legal name, no day-of-birth, no other PII.
create table children (
  id           uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references profiles (id) on delete cascade,
  pet_name     text,                 -- what the child is called (nickname / pet name) — never a legal name
  birth_month  smallint check (birth_month between 1 and 12),
  birth_year   smallint check (birth_year between 1990 and 2100),
  position     smallint not null default 0,   -- ordering for "Add another child"
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index children_parent_idx on children (parent_user_id, position);

create trigger children_set_updated_at
  before update on children
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table parent_profiles enable row level security;
alter table children enable row level security;

create policy parent_profiles_own on parent_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy parent_profiles_admin on parent_profiles
  for select using (is_admin());

create policy children_own on children
  for all using (auth.uid() = parent_user_id) with check (auth.uid() = parent_user_id);
create policy children_admin on children
  for select using (is_admin());
