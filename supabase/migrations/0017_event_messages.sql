-- 0017_event_messages.sql
-- Two-way messaging between a registrant and the event's organizers. One thread
-- per registration; either side posts into it. (The "Message" tab on the event
-- detail page + an organizer inbox in the admin area.)
-- Reuses owns_registration() (0014) and event_can_manage() (0013).

create table event_messages (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references events (id) on delete cascade,
  registration_id uuid not null references event_registrations (id) on delete cascade,
  sender_user_id  uuid references profiles (id) on delete set null,
  -- 'attendee' or 'organizer' — who sent it (kept explicit so a deleted sender
  -- row doesn't lose the side of the conversation).
  sender_role     text not null check (sender_role in ('attendee', 'organizer')),
  body            text not null,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index event_messages_thread_idx on event_messages (registration_id, created_at);
create index event_messages_event_idx on event_messages (event_id);

alter table event_messages enable row level security;

-- Read: the registrant who owns the thread, or anyone who can manage the event.
create policy event_messages_read on event_messages
  for select using (owns_registration(registration_id) or event_can_manage(event_id));

-- Insert: must be the sender, and either the owning registrant or an event manager.
create policy event_messages_insert on event_messages
  for insert with check (
    sender_user_id = auth.uid()
    and (owns_registration(registration_id) or event_can_manage(event_id))
  );

-- Update (mark read): owner or manager.
create policy event_messages_update on event_messages
  for update using (owns_registration(registration_id) or event_can_manage(event_id))
  with check (owns_registration(registration_id) or event_can_manage(event_id));
