-- 0002_onboarding.sql
-- The resume state-machine. One row per user (anon or permanent).

create table onboarding_progress (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  role            user_role,
  flow_version    integer not null default 1,        -- bump when flow.ts changes shape
  current_step    text,                              -- slug, matches flow.ts (e.g. 'profile')
  completed_steps text[] not null default '{}',      -- drives the progress bar
  status          onboarding_status not null default 'in_progress',
  -- Staging area for answers captured before a typed row exists (anonymous
  -- steps) or for anything not yet promoted to a typed table.
  answers         jsonb not null default '{}'::jsonb,
  started_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  completed_at    timestamptz
);

create index onboarding_progress_status_idx on onboarding_progress (status);
create index onboarding_progress_updated_idx on onboarding_progress (updated_at);

create trigger onboarding_progress_set_updated_at
  before update on onboarding_progress
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — a user only ever touches their own progress row.
-- ---------------------------------------------------------------------------
alter table onboarding_progress enable row level security;

create policy onboarding_own on onboarding_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy onboarding_admin_read on onboarding_progress
  for select using (is_admin());

-- ---------------------------------------------------------------------------
-- Cleanup of abandoned ANONYMOUS drafts.
-- Run from a scheduled job (pg_cron or an Edge Function) with the service role.
-- Deletes the auth user (cascades profile + all role data) for anonymous users
-- whose onboarding stalled > 14 days and never completed.
-- ---------------------------------------------------------------------------
create or replace function cleanup_abandoned_onboarding()
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  deleted_count integer;
begin
  with stale as (
    select op.user_id
    from public.onboarding_progress op
    join auth.users u on u.id = op.user_id
    where op.status <> 'completed'
      and op.updated_at < now() - interval '14 days'
      and u.is_anonymous = true            -- only purge never-converted drafts
      and u.email is null                  -- never attached an email => never registered
  )
  delete from auth.users where id in (select user_id from stale);
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- Example schedule (uncomment if pg_cron is enabled):
-- select cron.schedule('cleanup-onboarding', '0 3 * * *',
--   $$ select public.cleanup_abandoned_onboarding(); $$);
