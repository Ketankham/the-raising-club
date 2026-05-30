-- 0014_events_registration.sql
-- Events — participants / registration / payments / attendance side.
-- Capacity is tracked BY CHILD (event_registration_children), not by ticket.
-- Child SAFETY data (allergies/medical/support-needs) lives in a SEPARATE,
-- staff-gated table (child_safety_profiles) so the privacy-minimal `children`
-- table (pet_name + birth month/year only) is preserved. Roster shows pet_name.
-- Full Stripe payments + refunds + a credit ledger are modeled here.
-- Reuses: profiles, children, is_admin(), event_can_manage() (from 0013).
-- Run order: 0013 -> 0014.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type registration_status as enum (
  'pending', 'approved', 'waitlisted', 'confirmed', 'cancelled', 'denied'
);
create type attendance_status as enum ('registered', 'attended', 'no_show', 'cancelled');
create type event_payment_status as enum (
  'none', 'pending', 'paid', 'refunded', 'partially_refunded', 'credited'
);
create type refund_method as enum ('refund', 'credit');
create type media_consent as enum ('not_set', 'granted', 'declined');
-- The 5 "anything we should know" checkboxes (Screen #4) + safety profile fields.
create type support_need as enum (
  'sensory', 'allergies', 'communication_learning', 'medical_physical',
  'prefer_not_to_say', 'other'
);
create type reminder_kind as enum ('confirm', 'h48', 'h24', 'morning_of', 'update', 'post_event');

-- ---------------------------------------------------------------------------
-- child_safety_profiles : 1:1 with children, STAFF-GATED. Reusable across events.
-- (Decision #2.) Kept out of the general `children` table on purpose.
-- ---------------------------------------------------------------------------
create table child_safety_profiles (
  child_id      uuid primary key references children (id) on delete cascade,
  allergies     text[] not null default '{}',
  medical_notes text,
  support_needs support_need[] not null default '{}',
  support_note  text,
  updated_at    timestamptz not null default now()
);
create trigger child_safety_profiles_set_updated_at
  before update on child_safety_profiles
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- event_registrations : one per registrant (adult / household) per event.
-- ---------------------------------------------------------------------------
create table event_registrations (
  id                  uuid primary key default gen_random_uuid(),
  event_id            uuid not null references events (id) on delete cascade,
  session_id          uuid references event_sessions (id) on delete cascade, -- null when whole_event
  registrant_user_id  uuid not null references profiles (id) on delete cascade,
  status              registration_status not null default 'pending',
  adult_count         integer not null default 1 check (adult_count >= 0),
  contact_email       text,                                    -- reminders / updates
  contact_phone       text,
  notes               text,
  qr_token            uuid not null default gen_random_uuid(), -- check-in link / QR
  registered_at       timestamptz not null default now(),
  approved_at         timestamptz,
  cancelled_at        timestamptz,
  cancellation_reason text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create unique index event_reg_qr_idx on event_registrations (qr_token);
create index event_reg_event_idx on event_registrations (event_id, status);
create index event_reg_user_idx on event_registrations (registrant_user_id);
-- One active registration per user per (event, session).
create unique index event_reg_unique_active_idx
  on event_registrations (event_id, coalesce(session_id, '00000000-0000-0000-0000-000000000000'::uuid), registrant_user_id)
  where status not in ('cancelled', 'denied');
create trigger event_registrations_set_updated_at
  before update on event_registrations
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- authorized_pickups : required for drop-off events. Per registration.
-- ---------------------------------------------------------------------------
create table authorized_pickups (
  id              uuid primary key default gen_random_uuid(),
  registration_id uuid not null references event_registrations (id) on delete cascade,
  name            text not null,
  relationship    text,
  phone           text,
  created_at      timestamptz not null default now()
);
create index authorized_pickups_reg_idx on authorized_pickups (registration_id);

-- ---------------------------------------------------------------------------
-- emergency_contacts : per registration (drop-off events require at least one).
-- ---------------------------------------------------------------------------
create table emergency_contacts (
  id              uuid primary key default gen_random_uuid(),
  registration_id uuid not null references event_registrations (id) on delete cascade,
  name            text not null,
  relationship    text,
  phone           text not null,
  created_at      timestamptz not null default now()
);
create index emergency_contacts_reg_idx on emergency_contacts (registration_id);

-- ---------------------------------------------------------------------------
-- event_registration_children : THE CAPACITY UNIT (capacity by child, not ticket).
-- Snapshots pet_name + birth month/year so the roster stays correct even if the
-- child profile changes later. Support-needs captured per event (Screen #4).
-- ---------------------------------------------------------------------------
create table event_registration_children (
  id                     uuid primary key default gen_random_uuid(),
  registration_id        uuid not null references event_registrations (id) on delete cascade,
  child_id               uuid references children (id) on delete set null, -- null = ad-hoc child
  -- Snapshot (privacy-minimal, mirrors `children`):
  display_pet_name       text,
  birth_month            smallint check (birth_month between 1 and 12),
  birth_year             smallint check (birth_year between 1990 and 2100),
  -- Per-event support info (Screen #4 checkboxes + optional note):
  support_needs          support_need[] not null default '{}',
  support_note           text,
  -- Attendance / check-in:
  attendance_status      attendance_status not null default 'registered',
  checked_in_at          timestamptz,
  checked_out_at         timestamptz,
  picked_up_by_pickup_id uuid references authorized_pickups (id) on delete set null,
  created_at             timestamptz not null default now()
);
create index event_reg_children_reg_idx on event_registration_children (registration_id);
create index event_reg_children_child_idx on event_registration_children (child_id);

-- ---------------------------------------------------------------------------
-- waiver_acceptances : per-registration, versioned. media_consent carries the
-- YES/NO promotional-use choice on the media release.
-- ---------------------------------------------------------------------------
create table waiver_acceptances (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles (id) on delete cascade,
  waiver_id       uuid not null references waivers (id) on delete restrict,
  registration_id uuid references event_registrations (id) on delete cascade,
  media_consent   media_consent not null default 'not_set',
  accepted_at     timestamptz not null default now(),
  unique (user_id, waiver_id, registration_id)
);
create index waiver_acc_user_idx on waiver_acceptances (user_id);
create index waiver_acc_reg_idx on waiver_acceptances (registration_id);

-- ---------------------------------------------------------------------------
-- event_payments : Stripe. One payment per registration (donation/paid events).
-- ---------------------------------------------------------------------------
create table event_payments (
  id                         uuid primary key default gen_random_uuid(),
  registration_id            uuid not null references event_registrations (id) on delete cascade,
  stripe_payment_intent_id   text,
  stripe_checkout_session_id text,
  amount_cents               integer not null default 0 check (amount_cents >= 0),
  currency                   text not null default 'usd',
  status                     event_payment_status not null default 'none',
  receipt_url                text,
  refunded_amount_cents      integer not null default 0 check (refunded_amount_cents >= 0),
  refund_method              refund_method,
  refund_reason              text,
  refunded_at                timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);
create index event_payments_reg_idx on event_payments (registration_id);
create unique index event_payments_pi_idx on event_payments (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;
create trigger event_payments_set_updated_at
  before update on event_payments
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- event_credits : refund-as-credit ledger. Balance = sum(issued) - sum(redeemed).
-- ---------------------------------------------------------------------------
create table event_credits (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references profiles (id) on delete cascade,
  amount_cents             integer not null check (amount_cents > 0),
  currency                 text not null default 'usd',
  source_registration_id   uuid references event_registrations (id) on delete set null,
  redeemed_registration_id uuid references event_registrations (id) on delete set null,
  expires_at               timestamptz,
  created_at               timestamptz not null default now()
);
create index event_credits_user_idx on event_credits (user_id);

-- ---------------------------------------------------------------------------
-- event_reminders : send-log (prevents duplicate sends). The scheduler that
-- actually sends (cron / Vercel) is a follow-up; this records what went out.
-- ---------------------------------------------------------------------------
create table event_reminders (
  id              uuid primary key default gen_random_uuid(),
  registration_id uuid not null references event_registrations (id) on delete cascade,
  kind            reminder_kind not null,
  channel         text not null default 'email',
  sent_at         timestamptz not null default now(),
  unique (registration_id, kind)
);
create index event_reminders_reg_idx on event_reminders (registration_id);

-- ---------------------------------------------------------------------------
-- Helpers : ownership, capacity, age-gate, safety visibility.
-- ---------------------------------------------------------------------------

-- Does the current user own this registration?
create or replace function owns_registration(target_reg uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from event_registrations r
    where r.id = target_reg and r.registrant_user_id = auth.uid()
  );
$$;

-- Can the current user MANAGE the event a registration belongs to? (staff/host/admin)
create or replace function manages_registration(target_reg uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from event_registrations r
    where r.id = target_reg and event_can_manage(r.event_id)
  );
$$;

-- Can the current user view a child's safety profile? Owner, OR authorized staff
-- of an event the child is registered for. (Decision #2: staff-gated.)
create or replace function can_view_child_safety(target_child uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    is_admin()
    or exists (select 1 from children c where c.id = target_child and c.parent_user_id = auth.uid())
    or exists (
      select 1
      from event_registration_children erc
      join event_registrations r on r.id = erc.registration_id
      where erc.child_id = target_child and event_can_manage(r.event_id)
    );
$$;

-- Confirmed child count for an event (capacity check). Counts active registrations.
create or replace function event_confirmed_child_count(target_event uuid)
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::int
  from event_registration_children erc
  join event_registrations r on r.id = erc.registration_id
  where r.event_id = target_event
    and r.status in ('approved', 'confirmed', 'pending')
    and erc.attendance_status <> 'cancelled';
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table child_safety_profiles        enable row level security;
alter table event_registrations          enable row level security;
alter table authorized_pickups           enable row level security;
alter table emergency_contacts           enable row level security;
alter table event_registration_children  enable row level security;
alter table waiver_acceptances           enable row level security;
alter table event_payments               enable row level security;
alter table event_credits                enable row level security;
alter table event_reminders              enable row level security;

-- child_safety_profiles: owner writes; owner + authorized staff read.
create policy child_safety_owner_write on child_safety_profiles
  for all
  using (exists (select 1 from children c where c.id = child_id and c.parent_user_id = auth.uid()))
  with check (exists (select 1 from children c where c.id = child_id and c.parent_user_id = auth.uid()));
create policy child_safety_staff_read on child_safety_profiles
  for select using (can_view_child_safety(child_id));

-- event_registrations: registrant manages own; event staff read/update.
create policy event_reg_owner on event_registrations
  for all using (registrant_user_id = auth.uid()) with check (registrant_user_id = auth.uid());
create policy event_reg_staff_read on event_registrations
  for select using (event_can_manage(event_id));
create policy event_reg_staff_update on event_registrations
  for update using (event_can_manage(event_id)) with check (event_can_manage(event_id));

-- pickups / emergency contacts / reg-children: owner of the registration OR event staff.
create policy authorized_pickups_rw on authorized_pickups
  for all using (owns_registration(registration_id) or manages_registration(registration_id))
  with check (owns_registration(registration_id) or manages_registration(registration_id));

create policy emergency_contacts_rw on emergency_contacts
  for all using (owns_registration(registration_id) or manages_registration(registration_id))
  with check (owns_registration(registration_id) or manages_registration(registration_id));

create policy event_reg_children_rw on event_registration_children
  for all using (owns_registration(registration_id) or manages_registration(registration_id))
  with check (owns_registration(registration_id) or manages_registration(registration_id));

-- waiver_acceptances: the user owns theirs; event staff can read for their events.
create policy waiver_acc_owner on waiver_acceptances
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy waiver_acc_staff_read on waiver_acceptances
  for select using (registration_id is not null and manages_registration(registration_id));

-- payments: owner reads own; event staff read; writes via service role (Stripe webhook)
-- or admin. (No general user INSERT/UPDATE policy => only service_role / admin can mutate.)
create policy event_payments_owner_read on event_payments
  for select using (owns_registration(registration_id) or manages_registration(registration_id));
create policy event_payments_admin_write on event_payments
  for all using (is_admin()) with check (is_admin());

-- credits: user reads own; admin manages (issued on cancellation via service role/admin).
create policy event_credits_owner_read on event_credits
  for select using (user_id = auth.uid());
create policy event_credits_admin_write on event_credits
  for all using (is_admin()) with check (is_admin());

-- reminders: owner reads own; event staff manage.
create policy event_reminders_read on event_reminders
  for select using (owns_registration(registration_id) or manages_registration(registration_id));
create policy event_reminders_staff_write on event_reminders
  for all using (manages_registration(registration_id)) with check (manages_registration(registration_id));
