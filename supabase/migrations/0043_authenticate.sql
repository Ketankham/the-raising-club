-- 0043_authenticate.sql
-- Authenticate.com integration: identity verification + background checks.
-- Adds the Authenticate user code to caregiver_profiles, enriches the
-- verifications table with metadata + admin review fields, and seeds the
-- notification types used by the webhook handlers.
-- Run order: 0042 -> 0043.

-- ---------------------------------------------------------------------------
-- caregiver_profiles: store the opaque Authenticate user code (permanent,
-- written once on first "Start Verification" click).
-- ---------------------------------------------------------------------------
alter table caregiver_profiles
  add column if not exists authenticate_user_code text;

-- ---------------------------------------------------------------------------
-- verifications: metadata + admin review workflow columns.
-- ---------------------------------------------------------------------------
alter table verifications
  add column if not exists metadata jsonb,
  add column if not exists admin_review_required boolean not null default false,
  add column if not exists reviewed_by uuid references profiles (id) on delete set null,
  add column if not exists reviewed_at timestamptz;

-- Unique constraint required for ON CONFLICT upserts in webhook handlers.
-- A caregiver can have at most one row per verification type at a time;
-- re-verification overwrites the existing row.
alter table verifications
  drop constraint if exists verifications_user_type_unique;
alter table verifications
  add constraint verifications_user_type_unique unique (user_id, type);

-- ---------------------------------------------------------------------------
-- Extend the category check constraint to include 'verification'.
-- ---------------------------------------------------------------------------
alter table notification_types
  drop constraint if exists notification_types_category_check;
alter table notification_types
  add constraint notification_types_category_check
    check (category in ('courses', 'events', 'marketplace', 'general', 'verification'));

-- ---------------------------------------------------------------------------
-- Notification types
-- ---------------------------------------------------------------------------
insert into notification_types
  (key, category, name, description, inapp_enabled, email_enabled, cc_admin,
   inapp_title, inapp_body, email_subject, email_body, available_vars, sort_order)
values
  ('caregiver.verify_prompt', 'verification', 'Get Verified nudge',
   'Prompt sent to job-track caregivers after onboarding to encourage verification.',
   true, false, false,
   'Boost your profile — get verified!',
   'Completing identity verification helps families trust you and can lead to more bookings. Start now on your profile page.',
   '', '',
   '[{"token":"user_firstname","label":"User first name"}]'::jsonb,
   200),

  ('caregiver.identity_verified', 'verification', 'Identity verified',
   'Caregiver''s identity check passed via Authenticate.',
   true, false, false,
   'Identity verified ✅',
   'Your identity has been verified. Your profile now shows a Verified badge — families can see you''ve been checked.',
   '', '',
   '[{"token":"user_firstname","label":"User first name"}]'::jsonb,
   210),

  ('caregiver.background_check_complete', 'verification', 'Background check complete',
   'Caregiver''s background check came back clean via Authenticate.',
   true, false, false,
   'Background check complete ✅',
   'Your background check is complete and clear. Your profile now shows a Background Checked badge.',
   '', '',
   '[{"token":"user_firstname","label":"User first name"}]'::jsonb,
   220),

  ('admin.verification_red_flag', 'verification', 'Verification red flag',
   'A caregiver matched the sex offender registry — account auto-deactivated; admin must review.',
   true, false, true,
   'Red flag: sex offender match',
   'Caregiver {{caregiver_name}} ({{caregiver_email}}) matched the sex offender registry. Their account has been automatically deactivated and unpublished.',
   '', '',
   '[{"token":"caregiver_name","label":"Caregiver name"},{"token":"caregiver_email","label":"Caregiver email"}]'::jsonb,
   230),

  ('admin.verification_review_required', 'verification', 'Verification needs review',
   'A caregiver''s background check found criminal records — admin must review before clearing.',
   true, false, true,
   'Background check needs review',
   'Caregiver {{caregiver_name}} ({{caregiver_email}}) has criminal records on their background check. Please review in the admin verifications panel.',
   '', '',
   '[{"token":"caregiver_name","label":"Caregiver name"},{"token":"caregiver_email","label":"Caregiver email"}]'::jsonb,
   240),

  ('parent.caregiver_unavailable', 'verification', 'Caregiver no longer available',
   'Sent to parents/orgs who were in contact with a caregiver who has been removed from the platform.',
   true, false, false,
   'A caregiver you contacted is no longer available',
   'A caregiver you previously messaged is no longer available on The Raising Club. If you have any questions please contact our support team.',
   '', '',
   '[]'::jsonb,
   250)
on conflict (key) do nothing;
