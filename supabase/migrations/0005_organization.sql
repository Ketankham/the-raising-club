-- 0005_organization.sql
-- Program / Organization role. An organization is a first-class entity so it
-- can have multiple staff (supports the invite-staff flow). The onboarding user
-- becomes the 'owner' member.

create type org_role_title as enum ('director', 'owner', 'program_manager', 'hr_operations', 'other');

create type program_type as enum (
  'daycare', 'preschool', 'afterschool', 'weekend_enrichment', 'learning_pod', 'other'
);

create type program_size as enum ('1_5', '6_10', '11_25', '26_plus');  -- staff count

create type org_member_role as enum ('owner', 'admin', 'staff');
create type member_status   as enum ('invited', 'active', 'removed');

create type org_intent as enum (
  'manage_staff',          -- find and manage staff
  'standardize_training',  -- training & PD across the team
  'increase_visibility',   -- be discoverable
  'family_workshops',      -- offer workshops/learning for enrolled families
  'event_registration'     -- event registration pages for program events
);

create type job_status as enum ('draft', 'open', 'closed', 'filled');
create type application_status as enum ('applied', 'reviewing', 'shortlisted', 'rejected', 'hired', 'withdrawn');
create type invitation_status as enum ('pending', 'accepted', 'expired', 'revoked');

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
create table organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  owner_user_id uuid not null references profiles (id) on delete restrict,
  program_types program_type[] not null default '{}',
  ages_served   age_group[]    not null default '{}',
  size          program_size,
  multi_location boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index organizations_owner_idx on organizations (owner_user_id);
create trigger organizations_set_updated_at
  before update on organizations
  for each row execute function set_updated_at();

-- Org-level goals (Screen 5). Kept separate so it reads like the other *_profiles.
create table organization_profiles (
  org_id           uuid primary key references organizations (id) on delete cascade,
  contact_role_title org_role_title,        -- the onboarding user's title
  contact_role_other text,                  -- when title = 'other'
  intents          org_intent[] not null default '{}',
  updated_at       timestamptz not null default now()
);
create trigger organization_profiles_set_updated_at
  before update on organization_profiles
  for each row execute function set_updated_at();

create table organization_locations (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations (id) on delete cascade,
  label      text,
  zip_code   text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index org_locations_org_idx on organization_locations (org_id);

-- ---------------------------------------------------------------------------
-- Membership (M:N users <-> organizations) + staff invitations
-- ---------------------------------------------------------------------------
create table organization_members (
  org_id      uuid not null references organizations (id) on delete cascade,
  user_id     uuid not null references profiles (id) on delete cascade,
  member_role org_member_role not null default 'staff',
  status      member_status   not null default 'active',
  created_at  timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index org_members_user_idx on organization_members (user_id);

create table staff_invitations (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations (id) on delete cascade,
  email      text not null,
  invited_by uuid references profiles (id) on delete set null,
  token      uuid not null default gen_random_uuid(),
  status     invitation_status not null default 'pending',
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);
create unique index staff_inv_token_idx on staff_invitations (token);
create index staff_inv_org_idx on staff_invitations (org_id);

-- ---------------------------------------------------------------------------
-- Job posts + applications (Staff pillar)
-- ---------------------------------------------------------------------------
create table job_posts (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations (id) on delete cascade,
  title       text not null,
  description text,
  ages        age_group[] not null default '{}',
  status      job_status not null default 'draft',
  created_by  uuid references profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index job_posts_org_idx on job_posts (org_id, status);
create trigger job_posts_set_updated_at
  before update on job_posts
  for each row execute function set_updated_at();

create table job_applications (
  id           uuid primary key default gen_random_uuid(),
  job_post_id  uuid not null references job_posts (id) on delete cascade,
  caregiver_user_id uuid not null references profiles (id) on delete cascade,
  status       application_status not null default 'applied',
  cover_note   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (job_post_id, caregiver_user_id)
);
create index job_apps_caregiver_idx on job_applications (caregiver_user_id);
create trigger job_applications_set_updated_at
  before update on job_applications
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Helper: is the current user a member (any role) of this org?
-- ---------------------------------------------------------------------------
create or replace function is_org_member(target_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from organization_members m
    where m.org_id = target_org and m.user_id = auth.uid() and m.status = 'active'
  );
$$;

create or replace function is_org_admin(target_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from organization_members m
    where m.org_id = target_org and m.user_id = auth.uid()
      and m.status = 'active' and m.member_role in ('owner','admin')
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table organizations          enable row level security;
alter table organization_profiles  enable row level security;
alter table organization_locations enable row level security;
alter table organization_members   enable row level security;
alter table staff_invitations      enable row level security;
alter table job_posts              enable row level security;
alter table job_applications       enable row level security;

-- Organizations: members read; admins of the org (or owner) write; signed-in
-- users can read basic org rows (public program profile) — kept simple here as
-- member-or-admin read; widen later if a public directory is needed.
create policy orgs_member_read on organizations
  for select using (is_org_member(id) or is_admin());
create policy orgs_admin_write on organizations
  for all using (is_org_admin(id) or is_admin()) with check (is_org_admin(id) or is_admin());
-- Owner can create their org during onboarding:
create policy orgs_owner_insert on organizations
  for insert with check (auth.uid() = owner_user_id);

create policy orgprofile_member_read on organization_profiles
  for select using (is_org_member(org_id) or is_admin());
create policy orgprofile_admin_write on organization_profiles
  for all using (is_org_admin(org_id) or is_admin()) with check (is_org_admin(org_id) or is_admin());

create policy orgloc_member_read on organization_locations
  for select using (is_org_member(org_id) or is_admin());
create policy orgloc_admin_write on organization_locations
  for all using (is_org_admin(org_id) or is_admin()) with check (is_org_admin(org_id) or is_admin());

-- Members: a user sees membership rows for orgs they belong to; org admins manage.
create policy orgmembers_read on organization_members
  for select using (user_id = auth.uid() or is_org_member(org_id) or is_admin());
create policy orgmembers_admin_write on organization_members
  for all using (is_org_admin(org_id) or is_admin()) with check (is_org_admin(org_id) or is_admin());
-- Allow the owner to insert themselves as the first member during onboarding:
create policy orgmembers_self_insert on organization_members
  for insert with check (user_id = auth.uid());

create policy staffinv_admin on staff_invitations
  for all using (is_org_admin(org_id) or is_admin()) with check (is_org_admin(org_id) or is_admin());

-- Job posts: org members read; org admins write; published/open posts readable
-- by any signed-in user (caregivers browse roles).
create policy jobs_open_read on job_posts
  for select using (status = 'open' or is_org_member(org_id) or is_admin());
create policy jobs_admin_write on job_posts
  for all using (is_org_admin(org_id) or is_admin()) with check (is_org_admin(org_id) or is_admin());

-- Applications: the applying caregiver manages their own; org admins of the
-- target job's org can read/update.
create policy japps_caregiver on job_applications
  for all using (auth.uid() = caregiver_user_id) with check (auth.uid() = caregiver_user_id);
create policy japps_org_read on job_applications
  for select using (exists (
    select 1 from job_posts jp where jp.id = job_applications.job_post_id
      and (is_org_admin(jp.org_id) or is_admin())));
create policy japps_org_update on job_applications
  for update using (exists (
    select 1 from job_posts jp where jp.id = job_applications.job_post_id
      and (is_org_admin(jp.org_id) or is_admin())));
