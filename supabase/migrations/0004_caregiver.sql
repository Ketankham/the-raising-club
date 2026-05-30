-- 0004_caregiver.sql
-- Caregiver / Educator role data — the core trust asset.
-- PRIVACY (enforced by absence of columns + documented here): we NEVER store
-- date of birth, home address, or work-authorization status for caregivers.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
-- Branch intents (Screen 3 "What brings you here right now?")
create type caregiver_intent as enum (
  'paid_work',        -- A: looking for paid care work  (drives the JOB TRACK)
  'connect',          -- B: connect with other caregivers
  'attend_events',    -- C: attend events or classes
  'learn_grow'        -- D: learn and grow as a caregiver/educator
);

create type caregiver_experience_level as enum (
  'just_starting', 'lt_1_year', '1_3_years', '3_5_years', '5_10_years', '10_plus_years'
);

create type care_setting as enum (
  'one_child_family', 'multi_children_family', 'nanny_share', 'live_in',
  'tutoring_enrichment', 'group_center'
);

create type experience_type as enum (
  'own_family', 'babysitting', 'nannying', 'daycare_preschool',
  'afterschool_enrichment', 'teaching_tutoring', 'other'
);

create type education_level as enum (
  'high_school', 'some_college', 'associate', 'bachelor', 'graduate', 'prefer_not_to_say'
);

create type availability_type as enum (
  'full_time', 'part_time', 'occasional_backup', 'flexible'
);

create type availability_window as enum (
  'mornings', 'afternoons', 'evenings', 'occasional_overnight',
  'routine_overnight', 'weekends', 'flexible'
);

create type availability_openness as enum (
  'travel_us', 'travel_intl', 'multiple_locations', 'short_term', 'long_term'
);

-- Community-track (light) enums (Screen 10)
create type work_pattern as enum ('one_or_few', 'groups', 'varies');
create type group_setting as enum ('daycare', 'preschool', 'afterschool', 'enrichment', 'other');
create type group_size as enum ('1_5', '6_10', '11_15', '16_plus');

create type verification_type   as enum ('identity', 'background_check', 'reference');
create type verification_status as enum ('not_started', 'pending', 'verified', 'failed', 'expired');
create type review_status       as enum ('invited', 'submitted', 'published', 'declined');

-- ---------------------------------------------------------------------------
-- caregiver_profiles : 1:1 hub
-- ---------------------------------------------------------------------------
create table caregiver_profiles (
  user_id              uuid primary key references profiles (id) on delete cascade,
  -- Branch state (set at Screen 3, re-evaluated if the user edits it)
  intents              caregiver_intent[] not null default '{}',
  looking_for_paid_work boolean not null default false,    -- = 'paid_work' = ANY(intents)

  -- Profile narrative (master-doc spec)
  headline             text,        -- template-driven, e.g. "Infant & Toddler Caregiver · Calm routines"
  about                text,        -- "About My Work With Children"

  -- Job-track fields
  experience_level     caregiver_experience_level,
  rate_amount          numeric(8,2),
  rate_unit            text default 'hour',
  hours_per_week_min   smallint,
  hours_per_week_max   smallint,
  service_radius_miles smallint,

  -- Visibility: caregiver controls whether families/programs can see the profile.
  is_published         boolean not null default false,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger caregiver_profiles_set_updated_at
  before update on caregiver_profiles
  for each row execute function set_updated_at();

-- Keep looking_for_paid_work consistent with intents.
create or replace function sync_caregiver_paid_work()
returns trigger language plpgsql as $$
begin
  new.looking_for_paid_work := ('paid_work' = any(new.intents));
  return new;
end;
$$;
create trigger caregiver_sync_paid_work
  before insert or update of intents on caregiver_profiles
  for each row execute function sync_caregiver_paid_work();

-- ---------------------------------------------------------------------------
-- Multi-select sets (Screen 5 & 6)
-- ---------------------------------------------------------------------------
create table caregiver_age_groups (
  user_id uuid not null references caregiver_profiles (user_id) on delete cascade,
  age age_group not null,
  primary key (user_id, age)
);

create table caregiver_care_settings (
  user_id uuid not null references caregiver_profiles (user_id) on delete cascade,
  setting care_setting not null,
  primary key (user_id, setting)
);

create table caregiver_experience_types (
  user_id uuid not null references caregiver_profiles (user_id) on delete cascade,
  exp_type experience_type not null,
  primary key (user_id, exp_type)
);

-- Languages: min one; English default but removable (some caregivers speak only another).
create table caregiver_languages (
  user_id    uuid not null references caregiver_profiles (user_id) on delete cascade,
  language   text not null,                  -- ISO code or free text
  is_primary boolean not null default false,
  primary key (user_id, language)
);

-- ---------------------------------------------------------------------------
-- Education & certifications (Screen 6, optional)
-- ---------------------------------------------------------------------------
create table caregiver_education (
  user_id     uuid primary key references caregiver_profiles (user_id) on delete cascade,
  level       education_level,
  program     text,
  institution text,
  country     text,
  year        smallint,        -- optional; can be hidden on profile
  updated_at  timestamptz not null default now()
);
create trigger caregiver_education_set_updated_at
  before update on caregiver_education
  for each row execute function set_updated_at();

create table caregiver_certifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references caregiver_profiles (user_id) on delete cascade,
  name       text not null,        -- e.g. "CPR", "Early childhood course", "TRC training"
  issuer     text,
  valid_until date,
  file_url   text,                 -- uploaded proof (Supabase Storage)
  created_at timestamptz not null default now()
);
create index caregiver_certs_user_idx on caregiver_certifications (user_id);

-- ---------------------------------------------------------------------------
-- Availability (Screen 7) — 1:1 with array columns for the multi-selects
-- ---------------------------------------------------------------------------
create table caregiver_availability (
  user_id    uuid primary key references caregiver_profiles (user_id) on delete cascade,
  types      availability_type[]    not null default '{}',
  windows    availability_window[]  not null default '{}',
  openness   availability_openness[] not null default '{}',
  updated_at timestamptz not null default now()
);
create trigger caregiver_availability_set_updated_at
  before update on caregiver_availability
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Skills taxonomy (master-doc): ONE id per skill, shown in MANY sections.
-- ---------------------------------------------------------------------------
create table skill_sections (        -- the "green headers" + subheaders
  id        text primary key,        -- e.g. 'ages_experience', 'daily_routines'
  label     text not null,
  parent_id text references skill_sections (id),
  position  smallint not null default 0
);

create table skills (
  id        text primary key,        -- stable backend id; selected once by caregiver
  label     text not null,
  is_specialized boolean not null default false   -- counts toward the "max 10 specialized" rule
);

-- A skill can appear under multiple sections (display only; selection is single).
create table skill_section_map (
  skill_id   text not null references skills (id) on delete cascade,
  section_id text not null references skill_sections (id) on delete cascade,
  primary key (skill_id, section_id)
);

create table caregiver_skill_selections (
  user_id    uuid not null references caregiver_profiles (user_id) on delete cascade,
  skill_id   text not null references skills (id) on delete cascade,
  -- proof "tag" shown on profile: trc_course | cert_uploaded | degree | assessment | verified_experience
  proof      text,
  created_at timestamptz not null default now(),
  primary key (user_id, skill_id)
);

-- ---------------------------------------------------------------------------
-- Community track (Screen 10) — light path for non-job caregivers
-- ---------------------------------------------------------------------------
create table caregiver_community_context (
  user_id          uuid primary key references caregiver_profiles (user_id) on delete cascade,
  currently_working boolean,                 -- "Are you currently working/caring?" yes/no
  pattern          work_pattern,             -- one_or_few | groups | varies
  -- Path B (groups):
  setting          group_setting,
  size             group_size,
  -- Path B & C ages worked with most:
  ages             age_group[] not null default '{}',
  -- Path C setting note:
  context_note     text,
  updated_at       timestamptz not null default now()
);
create trigger caregiver_cc_set_updated_at
  before update on caregiver_community_context
  for each row execute function set_updated_at();

-- Path A: children they currently work with. Same privacy rule as `children`:
-- ONLY birth month, birth year, and a pet name (nickname).
create table caregiver_context_children (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references caregiver_profiles (user_id) on delete cascade,
  pet_name    text,                 -- nickname / pet name only — never a legal name
  birth_month smallint check (birth_month between 1 and 12),
  birth_year  smallint check (birth_year between 1990 and 2100),
  position    smallint not null default 0
);
create index cc_children_user_idx on caregiver_context_children (user_id, position);

-- ---------------------------------------------------------------------------
-- Trust layer: reviews + review invitations + verifications
-- ---------------------------------------------------------------------------
create table review_invitations (
  id           uuid primary key default gen_random_uuid(),
  caregiver_user_id uuid not null references caregiver_profiles (user_id) on delete cascade,
  invitee_name text not null,
  relationship text,                 -- family | employer | program | supervisor
  email        text,
  phone        text,
  token        uuid not null default gen_random_uuid(),   -- public link for the reviewer
  status       review_status not null default 'invited',
  created_at   timestamptz not null default now()
);
create index review_inv_caregiver_idx on review_invitations (caregiver_user_id);
create unique index review_inv_token_idx on review_invitations (token);

create table caregiver_reviews (
  id           uuid primary key default gen_random_uuid(),
  caregiver_user_id uuid not null references caregiver_profiles (user_id) on delete cascade,
  invitation_id uuid references review_invitations (id) on delete set null,
  reviewer_name text,
  relationship  text,
  rating        smallint check (rating between 1 and 5),
  body          text,
  -- Caregiver reviews each one before it appears publicly:
  is_published  boolean not null default false,
  status        review_status not null default 'submitted',
  created_at    timestamptz not null default now()
);
create index reviews_caregiver_idx on caregiver_reviews (caregiver_user_id);

-- Verification: status + provider only. We do NOT store sensitive PII; the
-- check itself happens with a third-party provider.
create table verifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles (id) on delete cascade,
  type       verification_type not null,
  status     verification_status not null default 'not_started',
  provider   text,
  reference  text,          -- opaque provider reference id
  valid_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index verifications_user_idx on verifications (user_id);
create trigger verifications_set_updated_at
  before update on verifications
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table caregiver_profiles            enable row level security;
alter table caregiver_age_groups          enable row level security;
alter table caregiver_care_settings       enable row level security;
alter table caregiver_experience_types    enable row level security;
alter table caregiver_languages           enable row level security;
alter table caregiver_education           enable row level security;
alter table caregiver_certifications      enable row level security;
alter table caregiver_availability        enable row level security;
alter table caregiver_skill_selections    enable row level security;
alter table caregiver_community_context   enable row level security;
alter table caregiver_context_children    enable row level security;
alter table review_invitations            enable row level security;
alter table caregiver_reviews             enable row level security;
alter table verifications                 enable row level security;
-- Taxonomy tables are public read, admin write.
alter table skills            enable row level security;
alter table skill_sections    enable row level security;
alter table skill_section_map enable row level security;

-- Owner full access on the hub + a public read of PUBLISHED profiles for any
-- signed-in user (families/programs browse caregivers).
create policy caregiver_profiles_own on caregiver_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy caregiver_profiles_public_read on caregiver_profiles
  for select using (is_published or auth.uid() = user_id or is_admin());

-- Helper: does the current user own this caregiver row (covers child tables)?
-- Owner-or-published read for the child detail tables; owner-only write.
create policy cg_age_rw on caregiver_age_groups
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy cg_age_read on caregiver_age_groups
  for select using (exists (select 1 from caregiver_profiles c
    where c.user_id = caregiver_age_groups.user_id and (c.is_published or is_admin())));

create policy cg_set_rw on caregiver_care_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy cg_set_read on caregiver_care_settings
  for select using (exists (select 1 from caregiver_profiles c
    where c.user_id = caregiver_care_settings.user_id and (c.is_published or is_admin())));

create policy cg_exp_rw on caregiver_experience_types
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy cg_exp_read on caregiver_experience_types
  for select using (exists (select 1 from caregiver_profiles c
    where c.user_id = caregiver_experience_types.user_id and (c.is_published or is_admin())));

create policy cg_lang_rw on caregiver_languages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy cg_lang_read on caregiver_languages
  for select using (exists (select 1 from caregiver_profiles c
    where c.user_id = caregiver_languages.user_id and (c.is_published or is_admin())));

create policy cg_edu_rw on caregiver_education
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy cg_edu_read on caregiver_education
  for select using (exists (select 1 from caregiver_profiles c
    where c.user_id = caregiver_education.user_id and (c.is_published or is_admin())));

create policy cg_cert_rw on caregiver_certifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy cg_cert_read on caregiver_certifications
  for select using (exists (select 1 from caregiver_profiles c
    where c.user_id = caregiver_certifications.user_id and (c.is_published or is_admin())));

create policy cg_avail_rw on caregiver_availability
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy cg_avail_read on caregiver_availability
  for select using (exists (select 1 from caregiver_profiles c
    where c.user_id = caregiver_availability.user_id and (c.is_published or is_admin())));

create policy cg_skill_rw on caregiver_skill_selections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy cg_skill_read on caregiver_skill_selections
  for select using (exists (select 1 from caregiver_profiles c
    where c.user_id = caregiver_skill_selections.user_id and (c.is_published or is_admin())));

-- Community context + its children: owner only (not part of public profile).
create policy cg_cc_own on caregiver_community_context
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy cg_cc_admin on caregiver_community_context
  for select using (is_admin());
create policy cg_ccchild_own on caregiver_context_children
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Review invitations: caregiver owner only (the reviewer uses a tokened public
-- endpoint via the service role, not RLS).
create policy review_inv_own on review_invitations
  for all using (auth.uid() = caregiver_user_id) with check (auth.uid() = caregiver_user_id);
create policy review_inv_admin on review_invitations
  for select using (is_admin());

-- Reviews: caregiver manages own; published reviews readable by signed-in users.
create policy reviews_own on caregiver_reviews
  for all using (auth.uid() = caregiver_user_id) with check (auth.uid() = caregiver_user_id);
create policy reviews_public_read on caregiver_reviews
  for select using (is_published or auth.uid() = caregiver_user_id or is_admin());

-- Verifications: owner manages; published proof tags surface via the profile,
-- but the row itself is owner/admin only.
create policy verifications_own on verifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy verifications_admin on verifications
  for select using (is_admin());

-- Taxonomy: anyone signed in can read; only admins write.
create policy skills_read on skills for select using (true);
create policy skills_admin on skills for all using (is_admin()) with check (is_admin());
create policy sections_read on skill_sections for select using (true);
create policy sections_admin on skill_sections for all using (is_admin()) with check (is_admin());
create policy map_read on skill_section_map for select using (true);
create policy map_admin on skill_section_map for all using (is_admin()) with check (is_admin());
