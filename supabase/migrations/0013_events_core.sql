-- 0013_events_core.sql
-- Events — catalog / creation side. Events are hosted by TRC (admin) OR by invited
-- organizations / schools / lead caregivers / host families. Capacity is tracked BY
-- CHILD (see 0014). This migration covers everything authored on the host side; the
-- participant / payment / attendance tables live in 0014_events_registration.sql.
-- Reuses: profiles, organizations, organization_members, is_admin(), is_org_admin().
-- Run order: 0012 -> 0013 -> 0014.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type event_join_mode    as enum ('online', 'in_person', 'hybrid');
create type event_style        as enum ('guided_class', 'open_play', 'workshop', 'ongoing_series');
create type participation_type as enum ('children_with_adult', 'children_dropoff', 'adults_only');
create type event_status       as enum ('draft', 'published', 'full', 'cancelled', 'completed', 'archived');
create type event_visibility   as enum ('public', 'private');
-- "$0 => Included", never "Free". donation = pay-what-you-can.
create type price_model        as enum ('included', 'paid', 'donation');
create type registration_scope as enum ('whole_event', 'per_session');
create type event_host_type    as enum ('trc', 'organization', 'lead_caregiver', 'host_family');
create type waiver_kind        as enum ('participation', 'media_release');
create type resource_kind      as enum ('link', 'vimeo', 'gdoc', 'gdrive', 'other');
create type location_kind      as enum ('physical', 'digital');
create type digital_platform   as enum ('zoom', 'google_meet', 'vimeo', 'other');
-- NOTE: membership-tier gating is intentionally DEFERRED — events are open to all
-- for now. The "Types of events" matrix tier columns can be added later via a
-- `membership_tier` enum + `event_tier_eligibility` join table.

-- ---------------------------------------------------------------------------
-- events : the core entity.
-- ---------------------------------------------------------------------------
create table events (
  id                        uuid primary key default gen_random_uuid(),
  slug                      text not null,                       -- SEO / shareable URL
  title                     text not null,
  summary                   text,
  what_to_expect            text,
  hero_image_url            text,
  join_mode                 event_join_mode    not null default 'in_person',
  style                     event_style,
  participation_type        participation_type not null default 'children_with_adult',
  expectant_parents_allowed boolean not null default false,
  -- Hard age-gate window, in months. null = unbounded on that side.
  age_min_months            integer check (age_min_months >= 0),
  age_max_months            integer check (age_max_months >= 0),
  visibility                event_visibility   not null default 'public',
  status                    event_status       not null default 'draft',
  price_model               price_model        not null default 'included',
  price_cents               integer not null default 0 check (price_cents >= 0),
  currency                  text not null default 'usd',
  -- Capacity by child (and a separate adult cap). null = unlimited.
  child_capacity            integer check (child_capacity >= 0),
  adult_capacity            integer check (adult_capacity >= 0),
  waitlist_enabled          boolean not null default false,
  requires_approval         boolean not null default false,
  cancellation_cutoff_hours integer not null default 12 check (cancellation_cutoff_hours >= 0),
  allow_credit_refund       boolean not null default false,      -- refund-as-credit option
  registration_scope        registration_scope not null default 'whole_event',
  is_recurring              boolean not null default false,
  host_type                 event_host_type    not null default 'trc',
  org_id                    uuid references organizations (id) on delete set null,
  created_by                uuid references profiles (id) on delete set null,
  timezone                  text not null default 'America/New_York',
  private_password_hash     text,                                -- optional private-event password
  published_at              timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint events_age_range_ck check (
    age_min_months is null or age_max_months is null or age_max_months >= age_min_months
  )
);
create unique index events_slug_idx on events (slug);
create index events_status_vis_idx on events (status, visibility);
create index events_org_idx on events (org_id);
create index events_created_by_idx on events (created_by);
create trigger events_set_updated_at
  before update on events
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Can the current user manage this event? (host / org admin / platform admin)
-- SECURITY DEFINER avoids RLS recursion; reused by every child table below + in 0014.
-- ---------------------------------------------------------------------------
create or replace function event_can_manage(target_event uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from events e
    where e.id = target_event
      and (
        is_admin()
        or e.created_by = auth.uid()
        or (e.org_id is not null and is_org_admin(e.org_id))
      )
  );
$$;

-- Is this event publicly visible to anyone (incl. anonymous)?
create or replace function event_is_public(target_event uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from events e
    where e.id = target_event
      and e.visibility = 'public'
      and e.status in ('published', 'full', 'completed')
  );
$$;

-- ---------------------------------------------------------------------------
-- event_sessions : one row per occurrence. Single-day event = one row; a
-- recurring series has many. registration_scope on events decides register-once
-- vs per-session.
-- ---------------------------------------------------------------------------
create table event_sessions (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references events (id) on delete cascade,
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  session_capacity integer check (session_capacity >= 0),       -- optional per-session override
  position         smallint not null default 0,
  created_at       timestamptz not null default now(),
  constraint event_sessions_time_ck check (ends_at > starts_at)
);
create index event_sessions_event_idx on event_sessions (event_id, starts_at);

-- ---------------------------------------------------------------------------
-- event_locations : physical or digital. Neighborhood shown first (bold),
-- address secondary. Digital events carry a join URL + instructions.
-- ---------------------------------------------------------------------------
create table event_locations (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references events (id) on delete cascade,
  session_id        uuid references event_sessions (id) on delete cascade,
  kind              location_kind not null,
  neighborhood      text,                                       -- shown first, bold
  address           text,                                       -- secondary
  lat               double precision,
  lng               double precision,
  arrival_notes     text,
  platform          digital_platform,                           -- digital only
  join_url          text,                                       -- digital only
  join_instructions text,                                       -- digital only (timing etc.)
  created_at        timestamptz not null default now()
);
create index event_locations_event_idx on event_locations (event_id);

-- ---------------------------------------------------------------------------
-- event_instructors : "Add instructor" screen. Either a linked platform user or
-- a freeform host entry.
-- ---------------------------------------------------------------------------
create table event_instructors (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events (id) on delete cascade,
  user_id    uuid references profiles (id) on delete set null,
  name       text,
  bio        text,
  avatar_url text,
  role_label text,
  position   smallint not null default 0,
  created_at timestamptz not null default now()
);
create index event_instructors_event_idx on event_instructors (event_id);

-- ---------------------------------------------------------------------------
-- event_resources : "Resources" tab. Host can upload up to 5 external links.
-- ---------------------------------------------------------------------------
create table event_resources (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references events (id) on delete cascade,
  label            text not null,
  url              text not null,
  kind             resource_kind not null default 'link',
  position         smallint not null default 0,
  registrants_only boolean not null default true,
  created_at       timestamptz not null default now()
);
create index event_resources_event_idx on event_resources (event_id);

-- Enforce the "max 5 links" rule from the doc.
create or replace function enforce_event_resource_cap()
returns trigger language plpgsql as $$
begin
  if (select count(*) from event_resources where event_id = new.event_id) >= 5 then
    raise exception 'An event can have at most 5 resources';
  end if;
  return new;
end;
$$;
create trigger event_resources_cap
  before insert on event_resources
  for each row execute function enforce_event_resource_cap();

-- NOTE: course/content access for events is intentionally DEFERRED. When the
-- courses schema exists we'll add an `event_course_links` join table here.

-- ---------------------------------------------------------------------------
-- Taxonomy : event_categories + map ("Types of events" matrix).
-- ---------------------------------------------------------------------------
create table event_categories (
  id       uuid primary key default gen_random_uuid(),
  slug     text not null unique,
  label    text not null,
  position smallint not null default 0
);

create table event_category_map (
  event_id    uuid not null references events (id) on delete cascade,
  category_id uuid not null references event_categories (id) on delete cascade,
  primary key (event_id, category_id)
);
create index event_category_map_cat_idx on event_category_map (category_id);

-- ---------------------------------------------------------------------------
-- waivers : versioned + reusable across events. event_waivers attaches versions
-- to a given event. (Acceptances are recorded per-registration in 0014.)
-- ---------------------------------------------------------------------------
create table waivers (
  id         uuid primary key default gen_random_uuid(),
  kind       waiver_kind not null,
  version    integer not null default 1,
  title      text not null,
  body       text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  unique (kind, version)
);

create table event_waivers (
  event_id  uuid not null references events (id) on delete cascade,
  waiver_id uuid not null references waivers (id) on delete restrict,
  primary key (event_id, waiver_id)
);

-- ---------------------------------------------------------------------------
-- event_invitations : private events (invite by email + token). Password (if any)
-- lives on events.private_password_hash. Mirrors staff_invitations conventions.
-- ---------------------------------------------------------------------------
create table event_invitations (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events (id) on delete cascade,
  email      text not null,
  token      uuid not null default gen_random_uuid(),
  invited_by uuid references profiles (id) on delete set null,
  status     invitation_status not null default 'pending',
  expires_at timestamptz not null default (now() + interval '30 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index event_inv_token_idx on event_invitations (token);
create index event_inv_event_idx on event_invitations (event_id);
create index event_inv_email_idx on event_invitations (lower(email));

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table events                 enable row level security;
alter table event_sessions         enable row level security;
alter table event_locations        enable row level security;
alter table event_instructors      enable row level security;
alter table event_resources        enable row level security;
alter table event_categories       enable row level security;
alter table event_category_map     enable row level security;
alter table waivers                enable row level security;
alter table event_waivers          enable row level security;
alter table event_invitations      enable row level security;

-- events: anyone (incl. anon) reads published public events; managers read/write theirs.
create policy events_public_read on events
  for select using (
    (visibility = 'public' and status in ('published', 'full', 'completed'))
    or event_can_manage(id)
  );
create policy events_manage_write on events
  for all using (event_can_manage(id)) with check (event_can_manage(id));
-- A host/org-admin/admin can create an event (created_by must be self unless admin).
create policy events_insert on events
  for insert with check (
    is_admin()
    or created_by = auth.uid()
    or (org_id is not null and is_org_admin(org_id))
  );

-- Child tables: readable when the parent event is public OR caller can manage; writable by managers.
create policy event_sessions_read on event_sessions
  for select using (event_is_public(event_id) or event_can_manage(event_id));
create policy event_sessions_write on event_sessions
  for all using (event_can_manage(event_id)) with check (event_can_manage(event_id));

create policy event_locations_read on event_locations
  for select using (event_is_public(event_id) or event_can_manage(event_id));
create policy event_locations_write on event_locations
  for all using (event_can_manage(event_id)) with check (event_can_manage(event_id));

create policy event_instructors_read on event_instructors
  for select using (event_is_public(event_id) or event_can_manage(event_id));
create policy event_instructors_write on event_instructors
  for all using (event_can_manage(event_id)) with check (event_can_manage(event_id));

-- Resources: public can see public-event resources only if not registrants_only.
create policy event_resources_read on event_resources
  for select using (
    (event_is_public(event_id) and registrants_only = false)
    or event_can_manage(event_id)
  );
create policy event_resources_write on event_resources
  for all using (event_can_manage(event_id)) with check (event_can_manage(event_id));

-- Taxonomy: readable by all; admin-managed.
create policy event_categories_read on event_categories for select using (true);
create policy event_categories_admin on event_categories
  for all using (is_admin()) with check (is_admin());

create policy event_category_map_read on event_category_map
  for select using (event_is_public(event_id) or event_can_manage(event_id));
create policy event_category_map_write on event_category_map
  for all using (event_can_manage(event_id)) with check (event_can_manage(event_id));

-- Waivers: any signed-in user can read active waivers (shown during registration); admin writes.
create policy waivers_read on waivers
  for select using (is_active or is_admin());
create policy waivers_admin on waivers
  for all using (is_admin()) with check (is_admin());

create policy event_waivers_read on event_waivers
  for select using (event_is_public(event_id) or event_can_manage(event_id));
create policy event_waivers_write on event_waivers
  for all using (event_can_manage(event_id)) with check (event_can_manage(event_id));

-- Invitations: managed by event managers; an invitee can look up their own by email.
create policy event_inv_manage on event_invitations
  for all using (event_can_manage(event_id)) with check (event_can_manage(event_id));
create policy event_inv_self_read on event_invitations
  for select using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- ---------------------------------------------------------------------------
-- Seed : event category taxonomy (from the "Types of events" matrix).
-- ---------------------------------------------------------------------------
insert into event_categories (slug, label, position) values
  ('play_social',          'Play & Social',          1),
  ('celebrations',         'Celebrations',           2),
  ('holidays_culture',     'Holidays & Culture',     3),
  ('outdoor_nature',       'Outdoor & Nature',       4),
  ('montessori_inspired',  'Montessori-Inspired',    5),
  ('learning_through_play','Learning Through Play',  6),
  ('caregiver_community',  'Caregiver Community',    7),
  ('professional_practice','Professional Practice',  8),
  ('language_bilingual',   'Language & Bilingual',   9),
  ('parent_education',     'Parent Education',       10),
  ('training_formation',   'Training / Formation',   11),
  ('community_rituals',    'Community Rituals',       12)
on conflict (slug) do nothing;
