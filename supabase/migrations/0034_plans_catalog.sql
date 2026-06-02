-- 0034_plans_catalog.sql
-- DB-driven, admin-managed membership plan catalog. Replaces the hardcoded
-- src/lib/membership/plans.ts (which becomes the one-time seed source, then is
-- removed). The public marketing page, the Settings picker, and entitlement all
-- read this table. `key` is stable & never renamed (persisted on user_plans).
--
-- audience values intentionally match the marketing-page tab ids
-- ('caregiver' | 'families' | 'centers') so role→tab mapping needs no extra layer.
-- Tab-level chrome (headings, "all programs include" list) stays in code as
-- presentation copy (src/lib/plans/types.ts TAB_META) — only the plan CARDS are
-- data here.
-- Run order: 0033 -> 0034.

create type plan_audience as enum ('caregiver', 'families', 'centers');

create table plans (
  id                        uuid primary key default gen_random_uuid(),
  key                       text not null unique,          -- stable slug, persisted on user_plans
  audience                  plan_audience not null,
  name                      text not null,
  badge                     text,                          -- "Most popular" / "Best value"
  subtitle                  text,
  description               text not null default '',
  cta                       text not null default 'Get Started',
  highlight                 boolean not null default false,
  is_free                   boolean not null default false,
  is_custom                 boolean not null default false, -- contact-us / custom pricing
  custom_label              text,
  unit                      text,                           -- e.g. "per site"
  price_monthly_cents       integer check (price_monthly_cents is null or price_monthly_cents >= 0),
  price_annual_cents        integer check (price_annual_cents is null or price_annual_cents >= 0),
  adult_seats               smallint,                       -- family seat limit (null = n/a)
  staff_seats               smallint,                       -- org seat limit (null = n/a)
  features                  jsonb not null default '[]'::jsonb,  -- [{label, body}]
  stripe_product_id         text,
  stripe_price_monthly_id   text,
  stripe_price_annual_id    text,
  is_active                 boolean not null default true,
  position                  smallint not null default 0,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index plans_audience_idx on plans (audience, position);

create trigger plans_set_updated_at
  before update on plans
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — catalog is public (active plans readable by anyone incl. logged-out
-- marketing page); admins manage everything.
-- ---------------------------------------------------------------------------
alter table plans enable row level security;

create policy plans_public_read on plans
  for select using (is_active or is_admin());
create policy plans_admin_all on plans
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- Seed from src/lib/membership/plans.ts. on conflict do nothing => re-runnable
-- without clobbering later admin edits.
-- ---------------------------------------------------------------------------
insert into plans (key, audience, name, badge, subtitle, description, cta, highlight, is_free, is_custom, custom_label, unit, price_monthly_cents, price_annual_cents, adult_seats, staff_seats, position, features) values

-- Caregiver & Educator -------------------------------------------------------
('trc_community', 'caregiver', 'TRC Community', null, 'Start here',
 'Caregivers and educators starting on TRC, creating a professional profile, and applying to a limited number of roles.',
 'Join for Free', false, true, false, null, null, null, null, null, null, 1,
 $json$[
   {"label":"Job access","body":"Apply to a limited number of family and program roles each month."},
   {"label":"Training & badge","body":"Foundational TRC lessons on safe care and early childhood principles."},
   {"label":"Visibility","body":"Standard caregiver profile visible to families and programs."}
 ]$json$::jsonb),

('trc_pro_caregiver', 'caregiver', 'TRC Pro Caregiver', 'Best value', 'Grow as a professional',
 'For career-focused caregivers & educators seeking consistent work and professional verification.',
 'Become a TRC Pro Caregiver', true, false, false, null, null, 1900, 19400, null, null, 2,
 $json$[
   {"label":"Best for","body":"Caregivers who want structured training, visible skills, and access to more stable, better-aligned roles as they grow professionally."},
   {"label":"Job access","body":"Access to the full range of roles, including leadership opportunities, pods, and TRC-led initiatives."},
   {"label":"Training & badge","body":"Structured TRC training with verified badges that make your skills visible to families and programs."},
   {"label":"Visibility","body":"Enhanced profile visibility, prioritized for better-aligned family and program roles."}
 ]$json$::jsonb),

('trc_lead_caregiver', 'caregiver', 'TRC Lead Caregiver', null, 'Lead and support others',
 'For experienced leaders managing pods, mentoring junior educators, or running micro-schools.',
 'Apply as a TRC Lead Caregiver', false, false, false, null, null, 4900, 50000, null, null, 3,
 $json$[
   {"label":"Best for","body":"Caregivers and educators with credentials in early childhood or advanced TRC training, prepared to guide others and support select family roles, including shared care such as learning pods and nanny shares."},
   {"label":"Job access","body":"Access to the full range of roles, including leadership opportunities, pods, and TRC-led initiatives."},
   {"label":"Training & badge","body":"Foundational TRC lessons on safe care and early childhood principles."},
   {"label":"Community & growth","body":"Lead pods, circles, and learning spaces, and support the growth of other caregivers."}
 ]$json$::jsonb),

-- Family ---------------------------------------------------------------------
('family_essentials', 'families', 'Family Essentials', null, 'Start here',
 'For anyone caring for or spending time with a child—parents, grandparents, aunts, uncles—who wants to understand the basics of child development and explore The Raising Club’s events and community at their own pace.',
 'Explore TRC', false, true, false, null, null, null, null, 1, null, 1,
 $json$[
   {"label":"Learning & guidance","body":"Foundational TRC guidance on child development and daily rhythms—simple, practical tools you can apply directly with your child."},
   {"label":"Caregiver & extended family","body":"Training for one adult (you), with role-specific guidance (parent, grandparent, aunt, uncle, or other family member)."},
   {"label":"Events & community","body":"Access to TRC events, community gatherings, and experiences—online and in person, where available."}
 ]$json$::jsonb),

('family_access', 'families', 'Family Access', null, 'Go deeper',
 'For families who want deeper learning, and to start connecting with other families and caregivers as part of everyday family life.',
 'Get Family Access', false, false, false, null, null, 2900, 29600, 3, null, 2,
 $json$[
   {"label":"Learning & guidance","body":"Everything in Family Essentials, plus the full A Raising Approach™ (one-on-one care) framework to raise a child with structure and shared understanding—with a partner and/or a caregiver."},
   {"label":"Caregiver & extended family","body":"Training for up to 3 adults in your Raising Club, with role-specific guidance for parents, co-parents, grandparents, extended family, or household support."},
   {"label":"Events & community","body":"Everything in Family Essentials, plus select TRC workshops and classes included as part of your membership."},
   {"label":"Care search & matching","body":"Smart matching and messaging with caregivers and nearby families—for one-on-one care, playdates, and trusted parent connections."}
 ]$json$::jsonb),

('family_club_plus', 'families', 'Family Club+', 'Most popular', 'Coordinate care together',
 'For families coordinating care with others—including nanny shares, shared-care setups, or extended family—who want a more integrated way of doing things together.',
 'Get Family Club+', true, false, false, null, null, 4900, 50000, 5, null, 3,
 $json$[
   {"label":"Learning & guidance","body":"Everything in Family Access, plus the A Raising Approach™ (shared care) framework for nanny shares, pods, and group care setups."},
   {"label":"Caregiver & extended family","body":"Training for up to 5 adults in your Raising Club, with role-specific guidance. Additional training seats may be added as needed."},
   {"label":"Events & community","body":"Everything in Family Access, plus the ability to host family gatherings and shared learning experiences—with support from TRC."},
   {"label":"Care search & matching","body":"Everything in Family Access, plus added support for shared care setups like nanny shares, pods, and group care."},
   {"label":"Parent–caregiver path","body":"Optional path to care for another child alongside your own, with structure, training, and support."}
 ]$json$::jsonb),

-- Centers & Programs ---------------------------------------------------------
('program_core', 'centers', 'Program Core', null, 'Best for small centers needing essential tools and basic coverage.',
 'Home daycares and single-site programs building a stable, aligned team.',
 'Get Started', false, false, false, null, 'per site', 14900, 152000, null, 4, 1,
 $json$[
   {"label":"Training seats & tracking","body":"Starter training seats to onboard staff into TRC foundations (up to 4 staff members)."}
 ]$json$::jsonb),

('program_growth', 'centers', 'Program Growth', 'Most popular', 'Best for growing programs needing visibility and advanced tracking.',
 'Multi-site networks and chains standardizing hiring and training across locations.',
 'See How It Works', true, false, false, null, 'per site', 34900, 356000, null, 10, 2,
 $json$[
   {"label":"Training seats & tracking","body":"Director dashboard to assign, track, and verify courses and badges (up to 10 staff members)."}
 ]$json$::jsonb),

('program_partner', 'centers', 'Program Partner', null, 'Best for large networks or franchise operators needing enterprise solutions.',
 'Multi-site networks and chains standardizing hiring and training across locations.',
 'Contact Us', false, false, true, 'Custom pricing. Get in touch to design your program.', null, null, null, null, null, 3,
 $json$[
   {"label":"Training seats & tracking","body":"Custom training seats with advanced reporting and a co-branded learning hub (seat count tailored to your program)."}
 ]$json$::jsonb)

on conflict (key) do nothing;
