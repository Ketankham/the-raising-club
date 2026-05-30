-- 0007_seed_taxonomy.sql
-- Seeds the caregiver "locked taxonomy" (green headers + subheaders) from the
-- master doc. These are the primary category navigation across the profile UI
-- and the backbone of the skills library. Individual skills are added later
-- (one id each) and mapped to one or more sections via skill_section_map.

insert into skill_sections (id, label, parent_id, position) values
  ('availability_logistics',     'Availability & Logistics',          null, 10),
  ('schedule_flexibility',       'Schedule & Flexibility',            'availability_logistics', 11),
  ('home_support',               'Home Support',                      'availability_logistics', 12),
  ('professionalism_docs',       'Professionalism & Documentation',   'availability_logistics', 13),

  ('ages_experience',            'Ages & Experience',                 null, 20),
  ('communication_language',     'Communication & Language',          null, 30),

  ('child_development_learning', 'Child Development & Learning',       null, 40),
  ('daily_routines',             'Daily Routines & Independence',     'child_development_learning', 41),
  ('physical_developmental',     'Physical & Developmental Needs',    'child_development_learning', 42),
  ('developmental_play',         'Developmental Play & Learning',     'child_development_learning', 43),
  ('social_emotional',           'Social-Emotional & Behavior',       'child_development_learning', 44),

  ('safety_health',              'Safety & Health',                   null, 50),
  ('special_support',            'Special Support (non-clinical)',    'safety_health', 51),

  ('education_credentials',      'Education & Credentials',           null, 60),
  ('highest_education',          'Highest education level',           'education_credentials', 61),
  ('credentials',                'Credentials',                       'education_credentials', 62)
on conflict (id) do nothing;

-- A couple of platform flags to start with.
insert into feature_flags (key, enabled, description) values
  ('onboarding_v2', true,  'New Next.js onboarding flow'),
  ('caregiver_verification', false, 'Show third-party verification options on caregiver profiles'),
  ('org_staff_invites', false, 'Enable organizations to invite staff members')
on conflict (key) do nothing;
