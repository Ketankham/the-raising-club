-- 0042_error_logs.sql
-- Records client-side errors, React crashes, and server action failures.
-- API route inserts via the anon key (public insert allowed); only admins
-- can read (admin_all policy). Run order: 0041 -> 0042.

create table if not exists user_error_logs (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  user_id      uuid references auth.users (id) on delete set null,
  -- where it happened
  page_url     text,
  component    text,          -- React component name or action name
  -- what happened
  error_type   text,          -- 'react_boundary' | 'unhandled_rejection' | 'action_failure' | 'network'
  message      text not null,
  stack        text,
  -- extra context (browser, OS, etc.)
  metadata     jsonb default '{}'
);

-- Anyone (including anon) can insert — the API route validates the payload.
-- Only admin users can read.
alter table user_error_logs enable row level security;

create policy "insert_open" on user_error_logs
  for insert with check (true);

create policy "admin_read" on user_error_logs
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Index for admin browsing (most-recent first, filter by user)
create index if not exists user_error_logs_created_at_idx on user_error_logs (created_at desc);
create index if not exists user_error_logs_user_id_idx    on user_error_logs (user_id);
