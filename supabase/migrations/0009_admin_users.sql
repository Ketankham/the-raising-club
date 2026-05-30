-- 0009_admin_users.sql
-- Admin user management: soft-deactivation + user invitations.

-- Soft deactivation (app-level; guards block deactivated users from the app).
alter table profiles add column if not exists deactivated_at timestamptz;

-- General "invite a user by email" (distinct from admin_invitations / staff_invitations).
create table if not exists user_invitations (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  role        user_role not null default 'parent',
  token       uuid not null default gen_random_uuid(),
  invited_by  uuid references profiles (id) on delete set null,
  status      invitation_status not null default 'pending',
  expires_at  timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);
create unique index if not exists user_inv_token_idx on user_invitations (token);
create index if not exists user_inv_email_idx on user_invitations (lower(email));

alter table user_invitations enable row level security;

-- Admin-only management.
drop policy if exists user_inv_admin on user_invitations;
create policy user_inv_admin on user_invitations
  for all using (is_admin()) with check (is_admin());
