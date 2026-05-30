-- 0019_courses_core.sql
-- Courses — authoring / creation side. Courses are authored by TRC admins.
-- Hierarchy (canonical, per Ketan): Course -> Chapter -> Module. A Module is
-- COMPOSABLE (optional rich-text body + optional embedded video + optional
-- resources) — not a rigid type. Optional "Pause & Notice" revision question
-- after a module. One final "Integration Moment" quiz per course -> certificate
-- (see 0020) -> skills awarded to caregivers (caregiver_skill_selections).
-- Reuses: profiles, skills, skill_sections, is_admin(), set_updated_at().
-- Run order: 0018 -> 0019 -> 0020.
--
-- Design notes baked in (from Reference-docs/Courses flow/COURSES-PLAN.md):
--   * Free for now: price/compare-at fields exist but no Stripe yet.
--   * Single language for now (no EN/ES translations table).
--   * Per-course certificate signatories live here (course_certificate_config).
--   * Final quiz: 60% pass, unlimited attempts (0020). Quiz answers (is_correct)
--     are NOT publicly readable — quiz_questions/options are manager-read-only;
--     the consumption layer grades server-side and reveals only after passing.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type course_status        as enum ('draft', 'published', 'archived');
create type course_care_type     as enum ('home_family', 'small_groups', 'schools_centers');
create type course_video_provider as enum ('youtube', 'vimeo');
create type course_resource_kind as enum ('link', 'youtube', 'vimeo', 'gdoc', 'gdrive', 'file', 'other');

-- ---------------------------------------------------------------------------
-- Taxonomy lookups : Category (single-select) + Approach (single-select).
-- Values captured from the live Browse Courses filters (Figma + screenshots).
-- Lookup tables (not enums) so admins can extend without a migration.
-- ---------------------------------------------------------------------------
create table course_categories (
  id       uuid primary key default gen_random_uuid(),
  slug     text not null unique,
  label    text not null,
  position smallint not null default 0
);

create table course_approaches (
  id       uuid primary key default gen_random_uuid(),
  slug     text not null unique,
  label    text not null,
  position smallint not null default 0
);

-- ---------------------------------------------------------------------------
-- courses : the core entity.
-- ---------------------------------------------------------------------------
create table courses (
  id                         uuid primary key default gen_random_uuid(),
  slug                       text not null,                       -- SEO / shareable URL
  title                      text not null,
  subtitle                   text,                                -- short tagline under title
  summary                    text,                                -- listing card blurb
  description                text,                                -- full detail-page description
  cover_image_url            text,
  intro_video_provider       course_video_provider,               -- welcome/intro video (optional)
  intro_video_url            text,
  status                     course_status not null default 'draft',
  category_id                uuid references course_categories (id) on delete set null,
  approach_id                uuid references course_approaches (id) on delete set null,
  care_type                  course_care_type,                    -- Home & Family / Small Groups / Schools & Centers
  -- Age window in months (listing slider 0 months .. 12 years). null = unbounded.
  age_min_months             integer check (age_min_months >= 0),
  age_max_months             integer check (age_max_months >= 0),
  -- Pricing: kept for later; FREE for now (no Stripe). compare_at = strikethrough.
  is_free                    boolean not null default true,
  price_cents                integer not null default 0 check (price_cents >= 0),
  compare_at_price_cents     integer check (compare_at_price_cents >= 0),
  currency                   text not null default 'usd',
  estimated_learning_minutes integer check (estimated_learning_minutes >= 0),
  mode                       text not null default 'Online · Self-paced',  -- shown on certificate
  skip_to_cert_enabled       boolean not null default false,      -- "Already trained?" inline link
  is_featured                boolean not null default false,
  created_by                 uuid references profiles (id) on delete set null,
  published_at               timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  constraint courses_age_range_ck check (
    age_min_months is null or age_max_months is null or age_max_months >= age_min_months
  )
);
create unique index courses_slug_idx on courses (slug);
create index courses_status_idx on courses (status);
create index courses_category_idx on courses (category_id);
create index courses_approach_idx on courses (approach_id);
create index courses_created_by_idx on courses (created_by);
create trigger courses_set_updated_at
  before update on courses
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Can the current user manage this course? (creator or platform admin)
-- SECURITY DEFINER avoids RLS recursion; reused by every child table below + 0020.
-- ---------------------------------------------------------------------------
create or replace function course_can_manage(target_course uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from courses c
    where c.id = target_course
      and (is_admin() or c.created_by = auth.uid())
  );
$$;

-- Is this course publicly visible (incl. anonymous)? Listing is a public page.
create or replace function course_is_public(target_course uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from courses c
    where c.id = target_course and c.status = 'published'
  );
$$;

-- ---------------------------------------------------------------------------
-- course_chapters : the sidebar "path" groups (Figma: "Introduction", ...).
-- ---------------------------------------------------------------------------
create table course_chapters (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references courses (id) on delete cascade,
  title      text not null,
  summary    text,
  position   smallint not null default 0,
  created_at timestamptz not null default now()
);
create index course_chapters_course_idx on course_chapters (course_id, position);

-- ---------------------------------------------------------------------------
-- course_modules : the atomic content unit (doc Screen #3). Composable:
-- body (rich text) + embedded video + resources. course_id denormalized for RLS.
-- ---------------------------------------------------------------------------
create table course_modules (
  id             uuid primary key default gen_random_uuid(),
  course_id      uuid not null references courses (id) on delete cascade,
  chapter_id     uuid not null references course_chapters (id) on delete cascade,
  title          text not null,
  body           text,                                  -- rich text (HTML), optional
  video_provider course_video_provider,                 -- optional embedded video
  video_url      text,
  est_minutes    integer check (est_minutes >= 0),      -- informational, visually secondary
  position       smallint not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index course_modules_chapter_idx on course_modules (chapter_id, position);
create index course_modules_course_idx on course_modules (course_id);
create trigger course_modules_set_updated_at
  before update on course_modules
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- course_module_resources : downloadable/linked resources for a module.
-- Mirrors event_resources. Capped at 10 per module.
-- ---------------------------------------------------------------------------
create table course_module_resources (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references courses (id) on delete cascade,
  module_id  uuid not null references course_modules (id) on delete cascade,
  label      text not null,
  kind       course_resource_kind not null default 'link',
  url        text,                                   -- external link / video
  file_path  text,                                   -- Supabase Storage path (kind = 'file')
  position   smallint not null default 0,
  created_at timestamptz not null default now(),
  constraint course_resource_target_ck check (url is not null or file_path is not null)
);
create index course_module_resources_module_idx on course_module_resources (module_id, position);

create or replace function enforce_course_resource_cap()
returns trigger language plpgsql as $$
begin
  if (select count(*) from course_module_resources where module_id = new.module_id) >= 10 then
    raise exception 'A module can have at most 10 resources';
  end if;
  return new;
end;
$$;
create trigger course_module_resources_cap
  before insert on course_module_resources
  for each row execute function enforce_course_resource_cap();

-- ---------------------------------------------------------------------------
-- Revision question ("Pause & Notice", doc Screen #4) — optional, after a module.
-- Shown once and never again (enforced by course_revision_answers in 0020).
-- Soft by design: per-option explanation; is_recommended is a gentle highlight,
-- NOT a hard right/wrong. These ARE publicly readable for published courses
-- (low-stakes reflection, no gating on them).
-- ---------------------------------------------------------------------------
create table course_revision_questions (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references courses (id) on delete cascade,
  module_id  uuid not null references course_modules (id) on delete cascade,
  prompt     text not null,
  position   smallint not null default 0,
  created_at timestamptz not null default now()
);
create index course_rev_q_module_idx on course_revision_questions (module_id, position);

create table course_revision_options (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references courses (id) on delete cascade,
  question_id   uuid not null references course_revision_questions (id) on delete cascade,
  body          text not null,
  explanation   text,                                  -- shown for each option (reflection)
  is_recommended boolean not null default false,       -- soft highlight only
  position      smallint not null default 0
);
create index course_rev_opt_question_idx on course_revision_options (question_id, position);

-- ---------------------------------------------------------------------------
-- Final quiz ("Integration Moment", doc Screens #5/#6) — one per course.
-- pass_threshold default 60. Unlimited attempts (enforced in 0020).
-- SECURITY: quiz_questions/options are MANAGER-READ-ONLY. The consumption layer
-- fetches them via a SECURITY DEFINER function that strips is_correct, and grades
-- server-side; correctness is revealed only after the learner clears the quiz.
-- ---------------------------------------------------------------------------
create table course_quizzes (
  id             uuid primary key default gen_random_uuid(),
  course_id      uuid not null references courses (id) on delete cascade unique,
  intro_copy     text,
  pass_threshold smallint not null default 60 check (pass_threshold between 0 and 100),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger course_quizzes_set_updated_at
  before update on course_quizzes
  for each row execute function set_updated_at();

create table course_quiz_questions (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references courses (id) on delete cascade,
  quiz_id    uuid not null references course_quizzes (id) on delete cascade,
  prompt     text not null,
  position   smallint not null default 0,
  created_at timestamptz not null default now()
);
create index course_quiz_q_quiz_idx on course_quiz_questions (quiz_id, position);

create table course_quiz_options (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references courses (id) on delete cascade,
  question_id uuid not null references course_quiz_questions (id) on delete cascade,
  body        text not null,
  explanation text,                                    -- shown on the soft review after passing
  is_correct  boolean not null default false,
  position    smallint not null default 0
);
create index course_quiz_opt_question_idx on course_quiz_options (question_id, position);

-- ---------------------------------------------------------------------------
-- course_skills : skills attached to a course. On completion (0020) a CAREGIVER
-- earns these into caregiver_skill_selections (proof = 'trc_course'), which the
-- marketplace Skills filter already reads. skills.id is text (existing taxonomy).
-- ---------------------------------------------------------------------------
create table course_skills (
  course_id uuid not null references courses (id) on delete cascade,
  skill_id  text not null references skills (id) on delete cascade,
  position  smallint not null default 0,
  primary key (course_id, skill_id)
);
create index course_skills_skill_idx on course_skills (skill_id);

-- ---------------------------------------------------------------------------
-- course_certificate_config : per-course certificate signers + footer (p59).
-- The Certificate ID scheme + verify token live on the issued cert (0020).
-- ---------------------------------------------------------------------------
create table course_certificate_config (
  course_id         uuid primary key references courses (id) on delete cascade,
  signer1_name      text,
  signer1_title     text,
  signer2_name      text,
  signer2_title     text,
  footer_disclaimer text default 'This certificate recognizes completion of coursework and does not confer a professional license.',
  updated_at        timestamptz not null default now()
);
create trigger course_cert_config_set_updated_at
  before update on course_certificate_config
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Bundles ("Learning Paths") : a priced set of courses.
-- ---------------------------------------------------------------------------
create table course_bundles (
  id                     uuid primary key default gen_random_uuid(),
  slug                   text not null unique,
  title                  text not null,
  summary                text,
  description            text,
  cover_image_url        text,
  status                 course_status not null default 'draft',
  is_free                boolean not null default true,
  price_cents            integer not null default 0 check (price_cents >= 0),
  compare_at_price_cents integer check (compare_at_price_cents >= 0),
  currency               text not null default 'usd',
  is_featured            boolean not null default false,
  created_by             uuid references profiles (id) on delete set null,
  published_at           timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create trigger course_bundles_set_updated_at
  before update on course_bundles
  for each row execute function set_updated_at();

create table course_bundle_items (
  bundle_id uuid not null references course_bundles (id) on delete cascade,
  course_id uuid not null references courses (id) on delete cascade,
  position  smallint not null default 0,
  primary key (bundle_id, course_id)
);
create index course_bundle_items_course_idx on course_bundle_items (course_id);

create or replace function course_bundle_can_manage(target_bundle uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from course_bundles b
    where b.id = target_bundle
      and (is_admin() or b.created_by = auth.uid())
  );
$$;

create or replace function course_bundle_is_public(target_bundle uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from course_bundles b
    where b.id = target_bundle and b.status = 'published'
  );
$$;

-- ===========================================================================
-- RLS
-- ===========================================================================
alter table course_categories          enable row level security;
alter table course_approaches           enable row level security;
alter table courses                     enable row level security;
alter table course_chapters             enable row level security;
alter table course_modules              enable row level security;
alter table course_module_resources     enable row level security;
alter table course_revision_questions   enable row level security;
alter table course_revision_options     enable row level security;
alter table course_quizzes              enable row level security;
alter table course_quiz_questions       enable row level security;
alter table course_quiz_options         enable row level security;
alter table course_skills               enable row level security;
alter table course_certificate_config   enable row level security;
alter table course_bundles              enable row level security;
alter table course_bundle_items         enable row level security;

-- Taxonomy: anyone can read; admin writes.
create policy course_categories_read on course_categories for select using (true);
create policy course_categories_admin on course_categories
  for all using (is_admin()) with check (is_admin());
create policy course_approaches_read on course_approaches for select using (true);
create policy course_approaches_admin on course_approaches
  for all using (is_admin()) with check (is_admin());

-- courses: anyone (incl. anon) reads published; managers read/write theirs.
create policy courses_public_read on courses
  for select using (status = 'published' or course_can_manage(id));
create policy courses_manage_write on courses
  for all using (course_can_manage(id)) with check (course_can_manage(id));
create policy courses_insert on courses
  for insert with check (is_admin() or created_by = auth.uid());

-- Chapters + modules + their resources: readable when course public OR manager.
create policy course_chapters_read on course_chapters
  for select using (course_is_public(course_id) or course_can_manage(course_id));
create policy course_chapters_write on course_chapters
  for all using (course_can_manage(course_id)) with check (course_can_manage(course_id));

create policy course_modules_read on course_modules
  for select using (course_is_public(course_id) or course_can_manage(course_id));
create policy course_modules_write on course_modules
  for all using (course_can_manage(course_id)) with check (course_can_manage(course_id));

create policy course_module_resources_read on course_module_resources
  for select using (course_is_public(course_id) or course_can_manage(course_id));
create policy course_module_resources_write on course_module_resources
  for all using (course_can_manage(course_id)) with check (course_can_manage(course_id));

-- Revision Q/options: low-stakes reflection — public-readable for published courses.
create policy course_rev_q_read on course_revision_questions
  for select using (course_is_public(course_id) or course_can_manage(course_id));
create policy course_rev_q_write on course_revision_questions
  for all using (course_can_manage(course_id)) with check (course_can_manage(course_id));

create policy course_rev_opt_read on course_revision_options
  for select using (course_is_public(course_id) or course_can_manage(course_id));
create policy course_rev_opt_write on course_revision_options
  for all using (course_can_manage(course_id)) with check (course_can_manage(course_id));

-- Quiz meta readable when public (so the player knows a quiz exists + threshold);
-- but quiz QUESTIONS and OPTIONS are MANAGER-ONLY (answers must not leak). The
-- consumption layer reads them via a SECURITY DEFINER function (0020).
create policy course_quizzes_read on course_quizzes
  for select using (course_is_public(course_id) or course_can_manage(course_id));
create policy course_quizzes_write on course_quizzes
  for all using (course_can_manage(course_id)) with check (course_can_manage(course_id));

create policy course_quiz_q_manage on course_quiz_questions
  for all using (course_can_manage(course_id)) with check (course_can_manage(course_id));
create policy course_quiz_opt_manage on course_quiz_options
  for all using (course_can_manage(course_id)) with check (course_can_manage(course_id));

-- Skills on a course: public read (shown on listing/detail); manager writes.
create policy course_skills_read on course_skills
  for select using (course_is_public(course_id) or course_can_manage(course_id));
create policy course_skills_write on course_skills
  for all using (course_can_manage(course_id)) with check (course_can_manage(course_id));

-- Certificate config: public read (signers shown on cert) ; manager writes.
create policy course_cert_config_read on course_certificate_config
  for select using (course_is_public(course_id) or course_can_manage(course_id));
create policy course_cert_config_write on course_certificate_config
  for all using (course_can_manage(course_id)) with check (course_can_manage(course_id));

-- Bundles: anyone reads published; managers read/write theirs.
create policy course_bundles_read on course_bundles
  for select using (status = 'published' or course_bundle_can_manage(id));
create policy course_bundles_write on course_bundles
  for all using (course_bundle_can_manage(id)) with check (course_bundle_can_manage(id));
create policy course_bundles_insert on course_bundles
  for insert with check (is_admin() or created_by = auth.uid());

create policy course_bundle_items_read on course_bundle_items
  for select using (course_bundle_is_public(bundle_id) or course_bundle_can_manage(bundle_id));
create policy course_bundle_items_write on course_bundle_items
  for all using (course_bundle_can_manage(bundle_id)) with check (course_bundle_can_manage(bundle_id));

-- ===========================================================================
-- Storage : public bucket for course cover images + resource files.
-- ===========================================================================
insert into storage.buckets (id, name, public)
values ('course-assets', 'course-assets', true)
on conflict (id) do nothing;

-- Public read of the bucket; admins write. (Bucket is public=true so anon read
-- works via CDN; these policies govern the storage.objects API path.)
create policy course_assets_public_read on storage.objects
  for select using (bucket_id = 'course-assets');
create policy course_assets_admin_write on storage.objects
  for insert with check (bucket_id = 'course-assets' and is_admin());
create policy course_assets_admin_update on storage.objects
  for update using (bucket_id = 'course-assets' and is_admin())
  with check (bucket_id = 'course-assets' and is_admin());
create policy course_assets_admin_delete on storage.objects
  for delete using (bucket_id = 'course-assets' and is_admin());

-- ===========================================================================
-- Seed : Category (8) + Approach (4) taxonomy (from live Browse Courses filters).
-- ===========================================================================
insert into course_categories (slug, label, position) values
  ('health_safety',            'Health & Safety',                                1),
  ('healthy_habits',           'Healthy Habits: Hygiene, Nutrition & Sleep',     2),
  ('cognitive_motor',          'Cognitive & Motor Development',                  3),
  ('emotional_social',         'Emotional and Social Development',               4),
  ('language_communication',   'Language and Communication',                     5),
  ('creativity_sensory',       'Creativity, Sensory Exploration and Expression', 6),
  ('environment_nature',       'Environment and Nature',                         7),
  ('inclusion_diverse_needs',  'Inclusion & Diverse Needs',                      8)
on conflict (slug) do nothing;

insert into course_approaches (slug, label, position) values
  ('modern_evidence_based', 'Modern Evidence Based Approach', 1),
  ('montessori',            'Montessori',                     2),
  ('reggio_emilia',         'Reggio Emilia',                  3),
  ('forest_schools',        'Forest Schools',                 4)
on conflict (slug) do nothing;

-- ===========================================================================
-- Seed : starter individual skills (Browse Courses "Skills" filter chips) mapped
-- to existing skill_sections (0007). The full skills library (master doc) is a
-- later seed; these unblock course->skill attachment + the marketplace filter.
-- ===========================================================================
insert into skills (id, label, is_specialized) values
  ('first_aid',            'First Aid',            true),
  ('nutrition',            'Nutrition',            false),
  ('behavior_management',  'Behavior Management',  true),
  ('creative_play',        'Creative Play',        false),
  ('inclusive_practice',   'Inclusive Practice',   true),
  ('observation',          'Observation',          false)
on conflict (id) do nothing;

insert into skill_section_map (skill_id, section_id) values
  ('first_aid',           'safety_health'),
  ('nutrition',           'safety_health'),
  ('behavior_management', 'social_emotional'),
  ('creative_play',       'developmental_play'),
  ('inclusive_practice',  'special_support'),
  ('observation',         'child_development_learning')
on conflict (skill_id, section_id) do nothing;
