-- 0032_notifications.sql
-- Notification system: an admin-managed catalog of notification TYPES (with
-- in-app + email body templates and per-channel enable toggles), a per-user
-- in-app feed, and an email outbox.
--
-- Design notes:
--  * Templates use {{token}} placeholders. render_template() substitutes a
--    jsonb bag of vars; the calling domain (events/courses/marketplace) passes
--    the real values at emit time. The DB owns the template text, so callers
--    can never forge notification bodies — they only choose type + vars + who.
--  * In-app rows are owner-only by RLS. Creation crosses accounts (the emitter
--    is usually NOT the recipient), so it goes through create_notification(),
--    a SECURITY DEFINER RPC — same pattern as the rest of the app.
--  * Email is PARKED (no provider wired yet). create_notification still records
--    intended emails in notification_emails with status 'skipped' so nothing is
--    lost; flip them to a real send once Resend is configured.
--  * No per-user preferences yet — only admins enable/disable channels per type.
--    Schema leaves room to add a user-prefs table later without a rewrite.

-- ---------------------------------------------------------------------------
-- Catalog: notification_types  (admin-managed, seeded below)
-- ---------------------------------------------------------------------------
create table if not exists notification_types (
  key             text primary key,                 -- e.g. 'event.registration_confirmed'
  category        text not null check (category in ('courses', 'events', 'marketplace', 'general')),
  name            text not null,                     -- admin-facing label
  description     text,                              -- what triggers it
  inapp_enabled   boolean not null default true,
  email_enabled   boolean not null default false,    -- email channel parked; off by default
  inapp_title     text not null default '',
  inapp_body      text not null default '',
  email_subject   text not null default '',
  email_body      text not null default '',
  cc_admin        boolean not null default false,    -- cc theraisingclub.tech@gmail.com
  available_vars  jsonb not null default '[]'::jsonb, -- [{token,label}] for the admin editor
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists notification_types_category_idx on notification_types (category, sort_order);

drop trigger if exists notification_types_set_updated_at on notification_types;
create trigger notification_types_set_updated_at
  before update on notification_types
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Per-user in-app feed: notifications
-- ---------------------------------------------------------------------------
create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  type_key    text not null references notification_types (key) on delete cascade,
  category    text not null,                         -- denormalized for filtering
  title       text not null,                         -- rendered snapshot
  body        text not null,                         -- rendered snapshot
  link        text,                                  -- optional deep link, e.g. /events/123
  payload     jsonb not null default '{}'::jsonb,    -- raw vars (debug / re-render)
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_created_idx on notifications (user_id, created_at desc);
create index if not exists notifications_user_unread_idx on notifications (user_id) where read_at is null;

-- ---------------------------------------------------------------------------
-- Email outbox / audit: notification_emails
-- ---------------------------------------------------------------------------
create table if not exists notification_emails (
  id              uuid primary key default gen_random_uuid(),
  notification_id uuid references notifications (id) on delete set null,
  to_email        text,
  cc              text,
  subject         text not null default '',
  body_html       text not null default '',
  status          text not null default 'pending'
                    check (status in ('pending', 'sent', 'failed', 'skipped')),
  provider_id     text,                              -- e.g. Resend message id
  error           text,
  created_at      timestamptz not null default now(),
  sent_at         timestamptz
);

create index if not exists notification_emails_status_idx on notification_emails (status, created_at);

-- ---------------------------------------------------------------------------
-- render_template(): {{token}} -> value substitution over a jsonb var bag.
-- ---------------------------------------------------------------------------
create or replace function render_template(tpl text, vars jsonb)
returns text
language plpgsql
immutable
as $$
declare
  result text := coalesce(tpl, '');
  k text;
  v text;
begin
  if vars is null then
    return result;
  end if;
  for k, v in select key, value from jsonb_each_text(vars) loop
    result := replace(result, '{{' || k || '}}', coalesce(v, ''));
  end loop;
  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- create_notification(): the single emit entry point. SECURITY DEFINER so a
-- server action can create a notification for ANY recipient (the emitter is
-- usually a different user or the system). Renders from the stored template;
-- callers cannot inject arbitrary body text — only type + vars + recipient.
-- ---------------------------------------------------------------------------
create or replace function create_notification(
  p_user_id  uuid,
  p_type_key text,
  p_vars     jsonb default '{}'::jsonb,
  p_link     text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  t          notification_types%rowtype;
  v_notif_id uuid;
  v_email    text;
begin
  select * into t from notification_types where key = p_type_key;
  if not found then
    raise exception 'unknown notification type: %', p_type_key;
  end if;

  -- In-app channel
  if t.inapp_enabled then
    insert into notifications (user_id, type_key, category, title, body, link, payload)
    values (
      p_user_id,
      p_type_key,
      t.category,
      render_template(t.inapp_title, p_vars),
      render_template(t.inapp_body, p_vars),
      p_link,
      coalesce(p_vars, '{}'::jsonb)
    )
    returning id into v_notif_id;
  end if;

  -- Email channel (PARKED: record intent as 'skipped' until a provider is wired)
  if t.email_enabled then
    select email into v_email from profiles where id = p_user_id;
    insert into notification_emails (notification_id, to_email, cc, subject, body_html, status)
    values (
      v_notif_id,
      v_email,
      case when t.cc_admin then 'theraisingclub.tech@gmail.com' else null end,
      render_template(t.email_subject, p_vars),
      render_template(t.email_body, p_vars),
      'skipped'
    );
  end if;

  return v_notif_id;
end;
$$;

grant execute on function create_notification(uuid, text, jsonb, text) to authenticated;

-- ---------------------------------------------------------------------------
-- mark_notifications_read(): mark some (or all) of the CALLER's notifications
-- read. Runs as the caller; RLS guarantees they can only touch their own rows.
-- ---------------------------------------------------------------------------
create or replace function mark_notifications_read(p_ids uuid[] default null)
returns integer
language sql
as $$
  with updated as (
    update notifications
       set read_at = now()
     where user_id = auth.uid()
       and read_at is null
       and (p_ids is null or id = any(p_ids))
    returning 1
  )
  select count(*)::int from updated;
$$;

grant execute on function mark_notifications_read(uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table notification_types  enable row level security;
alter table notifications       enable row level security;
alter table notification_emails enable row level security;

-- notification_types: admin-only. The render/emit path reads via SECURITY
-- DEFINER (create_notification), so regular users never need direct access.
drop policy if exists notification_types_admin_all on notification_types;
create policy notification_types_admin_all on notification_types
  for all using (is_admin()) with check (is_admin());

-- notifications: owner reads + updates (read_at) their own; admin reads all.
-- No user INSERT policy => inserts only via create_notification (SECURITY DEFINER).
drop policy if exists notifications_owner_read on notifications;
create policy notifications_owner_read on notifications
  for select using (user_id = auth.uid() or is_admin());

drop policy if exists notifications_owner_update on notifications;
create policy notifications_owner_update on notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- notification_emails: admin read only; written via SECURITY DEFINER path.
drop policy if exists notification_emails_admin_read on notification_emails;
create policy notification_emails_admin_read on notification_emails
  for select using (is_admin());

-- ---------------------------------------------------------------------------
-- Seed the catalog. on conflict do nothing keeps admin edits safe on re-run.
-- ---------------------------------------------------------------------------
insert into notification_types
  (key, category, name, description, inapp_enabled, email_enabled, cc_admin,
   inapp_title, inapp_body, email_subject, email_body, available_vars, sort_order)
values
  -- ---- Courses ----
  ('course.module_completed', 'courses', 'Module completed',
   'A learner finishes a module within a course.',
   true, false, false,
   'Module complete 🎉',
   'You''ve just finished {{module_name}}. You''re one step closer to mastering {{course_name}}. Keep it up!',
   '', '',
   '[{"token":"user_firstname","label":"User first name"},{"token":"module_name","label":"Module name"},{"token":"course_name","label":"Course name"}]'::jsonb,
   10),

  ('course.completed', 'courses', 'Course completed',
   'A learner completes an entire course.',
   true, false, false,
   'Course complete 🏅',
   'Congratulations {{user_firstname}}! You''ve completed {{course_name}}.',
   '', '',
   '[{"token":"user_firstname","label":"User first name"},{"token":"course_name","label":"Course name"}]'::jsonb,
   20),

  -- ---- Events ----
  ('event.registration_confirmed', 'events', 'Event registration confirmed',
   'A user successfully registers for an event.',
   true, true, true,
   'You''re registered! 🚀',
   'Registration for {{event_name}} is confirmed. See you on {{event_date}} at {{event_time}}!',
   'Confirmation: You''re attending {{event_name}}! 🚀',
   'Hi {{user_firstname}},\n\nYou''re officially registered for {{event_name}}.\n\nEvent: {{event_name}}\nDate: {{event_date}}\nTime: {{event_time}} ({{event_timezone}})\nLocation: {{event_location}}\n\nWhen it''s time to start, join here: {{event_link}}\n\nWe can''t wait to see you there.\n\nThe Raising Club Team',
   '[{"token":"user_firstname","label":"User first name"},{"token":"event_name","label":"Event name"},{"token":"event_date","label":"Event date"},{"token":"event_time","label":"Event time"},{"token":"event_timezone","label":"Timezone"},{"token":"event_location","label":"Location / link"},{"token":"event_link","label":"Join link"}]'::jsonb,
   30),

  ('event.cancelled', 'events', 'Event registration cancelled',
   'A user''s event registration is cancelled.',
   true, false, false,
   'Registration cancelled',
   'Your registration for {{event_name}} on {{event_date}} has been cancelled.',
   '', '',
   '[{"token":"user_firstname","label":"User first name"},{"token":"event_name","label":"Event name"},{"token":"event_date","label":"Event date"}]'::jsonb,
   40),

  ('event.reminder', 'events', 'Event reminder',
   'Reminder sent ahead of an event the user is registered for.',
   true, false, false,
   'Event reminder ⏰',
   'Reminder: {{event_name}} starts {{event_time}}. Join here: {{event_link}}',
   '', '',
   '[{"token":"event_name","label":"Event name"},{"token":"event_time","label":"Event time"},{"token":"event_link","label":"Join link"}]'::jsonb,
   50),

  ('event.payment_received', 'events', 'Event payment received',
   'Payment for a paid event is confirmed (fired from the Stripe webhook).',
   true, false, true,
   'Payment received ✅',
   'Payment of {{amount}} for {{event_name}} received. You''re all set!',
   '', '',
   '[{"token":"user_firstname","label":"User first name"},{"token":"event_name","label":"Event name"},{"token":"amount","label":"Amount paid"}]'::jsonb,
   60),

  -- ---- Marketplace ----
  ('marketplace.new_message', 'marketplace', 'New message',
   'A user receives a new direct message.',
   true, false, false,
   'New message 💬',
   '{{sender_name}} sent you a message.',
   '', '',
   '[{"token":"sender_name","label":"Sender name"}]'::jsonb,
   70),

  ('marketplace.job_application', 'marketplace', 'New job application',
   'A caregiver applies to one of the user''s open roles.',
   true, false, false,
   'New application 📨',
   '{{applicant_name}} applied to your role: {{job_title}}.',
   '', '',
   '[{"token":"applicant_name","label":"Applicant name"},{"token":"job_title","label":"Job title"}]'::jsonb,
   80),

  ('marketplace.application_status', 'marketplace', 'Application status changed',
   'The status of the user''s job application changes.',
   true, false, false,
   'Application update',
   'Your application to {{job_title}} is now {{status}}.',
   '', '',
   '[{"token":"job_title","label":"Job title"},{"token":"status","label":"New status"}]'::jsonb,
   90),

  ('marketplace.new_review', 'marketplace', 'New review',
   'A caregiver receives a new review.',
   true, false, false,
   'New review ⭐',
   '{{reviewer_name}} left you a review.',
   '', '',
   '[{"token":"reviewer_name","label":"Reviewer name"}]'::jsonb,
   100),

  -- ---- General / account ----
  ('account.welcome', 'general', 'Welcome (email confirmed)',
   'Sent after a user confirms their email and the account is verified.',
   true, true, false,
   'You''re verified! 🎉',
   'Welcome to The Raising Club, {{user_firstname}}! Your account is verified — explore courses, events, and the community.',
   'Welcome to The Raising Club 🎉',
   'Hi {{user_firstname}},\n\nYou''re Verified! 🎉\n\nWelcome to The Raising Club — where families and caregivers grow together. Your account is now fully verified, and you can access all features: post jobs, apply for opportunities, and explore our certified learning modules.\n\nThank you for being part of a community that raises standards in care and learning.\n\nWarmly,\nThe Raising Club Team\nhttps://theraisingclub.com/',
   '[{"token":"user_firstname","label":"User first name"}]'::jsonb,
   110)
on conflict (key) do nothing;
