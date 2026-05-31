-- 0023_marketplace_family_listings.sql
-- Marketplace · "Connect Families" (Figma slide 3). Opt-in public family listing
-- a parent fills out (budget, schedule, care needs, traits) and publishes to be
-- discovered by other families (playdates / nanny-share / co-hire) and caregivers.
-- Mirrors the caregiver_profiles publish model. Children COUNT + age tags on the
-- card derive from the existing `children` table (no new child storage).
-- Reuses: profiles, age_group, course_care_type, is_admin(), set_updated_at().
-- Run order: 0022 -> 0023.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
-- Schedule windows shown as the 📅 chip on the family card (and reused by jobs).
create type schedule_window as enum (
  'mornings', 'afternoons', 'evenings', 'weekdays', 'weekends', 'overnight', 'flexible'
);

-- What the family is open to (framing chips). co_hire = share one caregiver.
create type family_open_to as enum ('playdates', 'nanny_share', 'co_hire', 'meet_families');

-- ---------------------------------------------------------------------------
-- family_traits : seeded taxonomy for the trait chips (Outdoor activities,
-- Bilingual home, Pet friendly, ...). Lookup table so admins extend w/o migration.
-- ---------------------------------------------------------------------------
create table family_traits (
  id       text primary key,          -- stable slug
  label    text not null,
  position smallint not null default 0
);

-- ---------------------------------------------------------------------------
-- family_listings : 1:1 with a parent user. Private until is_published.
-- ---------------------------------------------------------------------------
create table family_listings (
  user_id            uuid primary key references profiles (id) on delete cascade,
  household_name     text,                          -- display name, e.g. "The Alvarez"
  headline           text,                          -- short tagline (optional)
  about              text,                          -- the blurb under the name
  care_needs         text,                          -- the "CARE NEEDS" box copy
  location_label     text,                          -- e.g. "Brooklyn, NY" (no exact address)
  zip_code           text,
  budget_min         numeric(8,2),
  budget_max         numeric(8,2),
  budget_unit        text not null default 'hour',
  care_type          course_care_type,              -- Home & Family / Small Groups / Schools & Centers
  cover_photo_url    text,                           -- family photo (falls back to avatar)
  co_hire_interested boolean not null default false, -- "looking to co-hire / nanny share"
  is_published       boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger family_listings_set_updated_at
  before update on family_listings
  for each row execute function set_updated_at();

-- Ages the family seeks care for (card age tags). Owner manages.
create table family_listing_age_groups (
  user_id uuid not null references family_listings (user_id) on delete cascade,
  age     age_group not null,
  primary key (user_id, age)
);

-- The 📅 schedule chips.
create table family_listing_schedule (
  user_id uuid not null references family_listings (user_id) on delete cascade,
  slot    schedule_window not null,
  primary key (user_id, slot)
);

-- "Open to" framing chips.
create table family_listing_open_to (
  user_id uuid not null references family_listings (user_id) on delete cascade,
  kind    family_open_to not null,
  primary key (user_id, kind)
);

-- Trait chips.
create table family_listing_traits (
  user_id  uuid not null references family_listings (user_id) on delete cascade,
  trait_id text not null references family_traits (id) on delete cascade,
  primary key (user_id, trait_id)
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table family_traits              enable row level security;
alter table family_listings            enable row level security;
alter table family_listing_age_groups  enable row level security;
alter table family_listing_schedule    enable row level security;
alter table family_listing_open_to     enable row level security;
alter table family_listing_traits      enable row level security;

-- Taxonomy: any signed-in user reads; admins write.
create policy family_traits_read  on family_traits for select using (true);
create policy family_traits_admin on family_traits for all using (is_admin()) with check (is_admin());

-- Listing: owner full access; published readable by ANY authenticated user
-- (caregivers + other parents browse). Snapshot-independent SELECT predicate so
-- INSERT ... RETURNING works for the creator (see 0022 guardrail / web/learnings.md).
create policy family_listings_own on family_listings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy family_listings_public_read on family_listings
  for select using (is_published or auth.uid() = user_id or is_admin());

-- Child sets: owner writes; readable when the parent listing is published (or own/admin).
create policy fl_age_rw on family_listing_age_groups
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy fl_age_read on family_listing_age_groups
  for select using (exists (select 1 from family_listings f
    where f.user_id = family_listing_age_groups.user_id and (f.is_published or is_admin())));

create policy fl_sched_rw on family_listing_schedule
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy fl_sched_read on family_listing_schedule
  for select using (exists (select 1 from family_listings f
    where f.user_id = family_listing_schedule.user_id and (f.is_published or is_admin())));

create policy fl_open_rw on family_listing_open_to
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy fl_open_read on family_listing_open_to
  for select using (exists (select 1 from family_listings f
    where f.user_id = family_listing_open_to.user_id and (f.is_published or is_admin())));

create policy fl_trait_rw on family_listing_traits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy fl_trait_read on family_listing_traits
  for select using (exists (select 1 from family_listings f
    where f.user_id = family_listing_traits.user_id and (f.is_published or is_admin())));

-- ---------------------------------------------------------------------------
-- Seed traits (from Figma slide 3 chips + sensible starters).
-- ---------------------------------------------------------------------------
insert into family_traits (id, label, position) values
  ('outdoor_activities',      'Outdoor activities',       1),
  ('bilingual_home',          'Bilingual home',           2),
  ('pet_friendly',            'Pet friendly',             3),
  ('screen_free',             'Screen-free',              4),
  ('montessori_minded',       'Montessori-minded',        5),
  ('special_needs_friendly',  'Special needs friendly',   6),
  ('nut_free',                'Nut-free home',            7),
  ('music_arts',              'Music & arts',             8),
  ('active_sporty',           'Active & sporty',          9),
  ('quiet_calm',              'Quiet & calm',            10)
on conflict (id) do nothing;
