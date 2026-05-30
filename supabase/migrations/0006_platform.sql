-- 0006_platform.sql
-- Admin / platform surface: audit log, feature flags, admin invitations.

-- Admins are provisioned, never self-served.
create table admin_invitations (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  token      uuid not null default gen_random_uuid(),
  invited_by uuid references profiles (id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);
create unique index admin_inv_token_idx on admin_invitations (token);

-- Audit log for admin actions + sensitive role changes (e.g. mid-flow role switch).
create table audit_log (
  id         bigint generated always as identity primary key,
  actor_id   uuid references profiles (id) on delete set null,
  action     text not null,                  -- e.g. 'role_changed', 'review_published'
  subject_type text,                          -- e.g. 'profile', 'caregiver_review'
  subject_id text,
  details    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_actor_idx on audit_log (actor_id);
create index audit_log_subject_idx on audit_log (subject_type, subject_id);

-- Feature flags (admin-managed; readable by all signed-in users).
create table feature_flags (
  key         text primary key,
  enabled     boolean not null default false,
  description text,
  updated_at  timestamptz not null default now()
);
create trigger feature_flags_set_updated_at
  before update on feature_flags
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table admin_invitations enable row level security;
alter table audit_log         enable row level security;
alter table feature_flags     enable row level security;

create policy admin_inv_admin_only on admin_invitations
  for all using (is_admin()) with check (is_admin());

-- Audit log: admins read; inserts happen via service role / SECURITY DEFINER fns.
create policy audit_admin_read on audit_log
  for select using (is_admin());

create policy flags_read on feature_flags for select using (true);
create policy flags_admin_write on feature_flags
  for all using (is_admin()) with check (is_admin());
