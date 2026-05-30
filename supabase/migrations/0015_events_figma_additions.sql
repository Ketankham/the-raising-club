-- 0015_events_figma_additions.sql
-- Additive changes surfaced by the Figma event designs (see EVENTS-PLAN.md §11):
--   1. events.is_featured        — the "Featured" badge on list + detail.
--   2. events.agenda             — the "Schedule" tab (free-form agenda blocks).
--   3. event_saves               — the heart / "Save for later" (also doc Screen #2 #10).
--   4. event_resources file mode — Figma shows downloadable FILES, not just links:
--                                  extend resource_kind with 'file' + add file_path.
-- All additive / non-destructive. Run order: 0014 -> 0015.

-- ---------------------------------------------------------------------------
-- 1 + 2: events flags / agenda
-- ---------------------------------------------------------------------------
alter table events add column if not exists is_featured boolean not null default false;
-- Agenda blocks for the "Schedule" tab, e.g.
--   [{ "time": "9:00 AM", "title": "Welcome circle", "description": "..." }, ...]
alter table events add column if not exists agenda jsonb not null default '[]'::jsonb;

create index if not exists events_featured_idx on events (is_featured) where is_featured;

-- ---------------------------------------------------------------------------
-- 3: event_saves — "Save for later" / favorites (heart icon).
-- ---------------------------------------------------------------------------
create table if not exists event_saves (
  user_id    uuid not null references profiles (id) on delete cascade,
  event_id   uuid not null references events (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);
create index if not exists event_saves_event_idx on event_saves (event_id);

alter table event_saves enable row level security;

drop policy if exists event_saves_own on event_saves;
create policy event_saves_own on event_saves
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists event_saves_admin_read on event_saves;
create policy event_saves_admin_read on event_saves
  for select using (is_admin());

-- ---------------------------------------------------------------------------
-- 4: event_resources can be a downloadable FILE (Supabase Storage) as well as a link.
-- NOTE: ALTER TYPE ... ADD VALUE is allowed inside a transaction on PG12+ as long as
-- the new value is not used in the same transaction (we don't — we only add a column).
-- ---------------------------------------------------------------------------
alter type resource_kind add value if not exists 'file';
-- Storage path when kind = 'file' (url stays for external links).
alter table event_resources add column if not exists file_path text;
alter table event_resources alter column url drop not null;  -- file resources have file_path, not url
