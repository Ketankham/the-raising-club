-- 0024_marketplace_jobs.sql
-- Marketplace jobs (the "Find jobs" / "My applications" loop + the
-- "Invite to Co-Hire" modal, Figma slide 1). Rather than a parallel `jobs`
-- table, this EXTENDS the org-scoped `job_posts` / `job_applications` scaffold
-- from 0005 into the canonical marketplace jobs surface:
--   * Parents (owner_user_id, org_id NULL) AND organizations post jobs.
--   * Caregivers browse 'open' jobs and apply (job_applications).
--   * Owners invite caregivers to their jobs (job_invitations).
-- Decision 3: single owner per job (`is_co_hire` is framing only).
-- The existing enum value job_status='open' is the "Active" badge in the UI.
-- Reuses enums job_status/application_status/invitation_status (0005),
-- schedule_window (0023), skills, course_care_type, is_admin()/is_org_admin().
-- The two existing read-only consumers (org-home count, org-profile list by
-- org_id) keep working — all changes here are additive / widen access.
-- Run order: 0023 -> 0024.

-- ---------------------------------------------------------------------------
-- 1. job_posts: owner-or-org owned + marketplace fields.
-- ---------------------------------------------------------------------------
alter table job_posts alter column org_id drop not null;
alter table job_posts add column if not exists owner_user_id uuid references profiles (id) on delete cascade;
alter table job_posts add column if not exists care_type      course_care_type;
alter table job_posts add column if not exists location_label text;
alter table job_posts add column if not exists zip_code       text;
alter table job_posts add column if not exists pay_min        numeric(8,2);
alter table job_posts add column if not exists pay_max        numeric(8,2);
alter table job_posts add column if not exists pay_unit       text not null default 'hour';
alter table job_posts add column if not exists hours_per_week smallint;
alter table job_posts add column if not exists schedule_label text;
alter table job_posts add column if not exists schedule       schedule_window[] not null default '{}';
alter table job_posts add column if not exists start_date     date;
alter table job_posts add column if not exists is_co_hire     boolean not null default false;
alter table job_posts add column if not exists openings       smallint not null default 1;
alter table job_posts add column if not exists published_at   timestamptz;
alter table job_posts add column if not exists closes_at      timestamptz;

-- Backfill owner for pre-existing org rows = the org owner.
update job_posts jp set owner_user_id = o.owner_user_id
  from organizations o where jp.org_id = o.id and jp.owner_user_id is null;

create index if not exists job_posts_owner_idx  on job_posts (owner_user_id);
create index if not exists job_posts_status_idx on job_posts (status);

-- Stamp published_at the first time a post goes 'open'.
create or replace function job_posts_set_published_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'open' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists job_posts_publish on job_posts;
create trigger job_posts_publish before insert or update of status on job_posts
  for each row execute function job_posts_set_published_at();

-- ---------------------------------------------------------------------------
-- 2. applications gain an optional proposed rate.
-- ---------------------------------------------------------------------------
alter table job_applications add column if not exists proposed_rate numeric(8,2);

-- ---------------------------------------------------------------------------
-- 3. desired skills (reuse the caregiver skills taxonomy).
-- ---------------------------------------------------------------------------
create table job_skills (
  job_post_id uuid not null references job_posts (id) on delete cascade,
  skill_id    text not null references skills (id) on delete cascade,
  primary key (job_post_id, skill_id)
);

-- ---------------------------------------------------------------------------
-- 4. job_invitations (co-hire modal). One row per (job, caregiver); the modal
-- sends a batch over several jobs sharing one personal message.
-- ---------------------------------------------------------------------------
create table job_invitations (
  id                uuid primary key default gen_random_uuid(),
  job_post_id       uuid not null references job_posts (id) on delete cascade,
  caregiver_user_id uuid not null references profiles (id) on delete cascade,
  invited_by        uuid references profiles (id) on delete set null,
  message           text,
  status            invitation_status not null default 'pending',  -- 'pending' = sent
  created_at        timestamptz not null default now(),
  responded_at      timestamptz,
  unique (job_post_id, caregiver_user_id)
);
create index job_invites_job_idx       on job_invitations (job_post_id);
create index job_invites_caregiver_idx on job_invitations (caregiver_user_id);

-- ---------------------------------------------------------------------------
-- Manage helper: owner OR org-admin OR platform admin. SECURITY DEFINER so it
-- is snapshot-independent and avoids RLS recursion from child-table policies.
-- ---------------------------------------------------------------------------
create or replace function job_can_manage(target_job uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.job_posts j
    where j.id = target_job
      and (j.owner_user_id = auth.uid()
           or (j.org_id is not null and is_org_admin(j.org_id))
           or is_admin())
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS — replace the org-only policies from 0005 with owner-or-org-aware ones.
-- ---------------------------------------------------------------------------
-- job_posts: manage if owner/org-admin/admin. Read if 'open' OR manage OR you're
-- an applicant/invitee. Predicate is snapshot-independent for the creator's
-- own draft (owner_user_id = auth.uid()), so INSERT … RETURNING works (0022).
drop policy if exists jobs_open_read  on job_posts;
drop policy if exists jobs_admin_write on job_posts;

create policy job_posts_manage on job_posts
  for all using (owner_user_id = auth.uid()
                 or (org_id is not null and is_org_admin(org_id))
                 or is_admin())
  with check (owner_user_id = auth.uid()
              or (org_id is not null and is_org_admin(org_id))
              or is_admin());

create policy job_posts_read on job_posts
  for select using (
    status = 'open'
    or owner_user_id = auth.uid()
    or (org_id is not null and is_org_admin(org_id))
    or is_admin()
    or exists (select 1 from job_applications a
        where a.job_post_id = job_posts.id and a.caregiver_user_id = auth.uid())
    or exists (select 1 from job_invitations i
        where i.job_post_id = job_posts.id and i.caregiver_user_id = auth.uid())
  );

-- applications: caregiver owns their row; job manager reads + updates status.
drop policy if exists japps_caregiver on job_applications;
drop policy if exists japps_org_read  on job_applications;
drop policy if exists japps_org_update on job_applications;

create policy japps_caregiver on job_applications
  for all using (auth.uid() = caregiver_user_id) with check (auth.uid() = caregiver_user_id);
create policy japps_manager_read on job_applications
  for select using (job_can_manage(job_post_id));
create policy japps_manager_update on job_applications
  for update using (job_can_manage(job_post_id)) with check (job_can_manage(job_post_id));

-- job_skills: managers write; readable whenever the job is readable (open or manage).
alter table job_skills enable row level security;
create policy job_skill_manage on job_skills
  for all using (job_can_manage(job_post_id)) with check (job_can_manage(job_post_id));
create policy job_skill_read on job_skills
  for select using (exists (select 1 from job_posts j
    where j.id = job_skills.job_post_id and (j.status = 'open' or job_can_manage(j.id))));

-- invitations: job manager creates/manages; the invited caregiver reads + can
-- update status (accept/decline) on their own row.
alter table job_invitations enable row level security;
create policy job_invites_manager on job_invitations
  for all using (job_can_manage(job_post_id)) with check (job_can_manage(job_post_id));
create policy job_invites_caregiver_read on job_invitations
  for select using (caregiver_user_id = auth.uid());
create policy job_invites_caregiver_update on job_invitations
  for update using (caregiver_user_id = auth.uid()) with check (caregiver_user_id = auth.uid());
