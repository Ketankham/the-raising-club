-- 0043_authenticate.sql
-- Authenticate (authenticate.com) integration scaffolding.
-- Adds authenticate_user_code to caregiver_profiles, enriches verifications with
-- metadata + admin-review fields, adds a unique (user_id, type) constraint so
-- webhook upserts are idempotent, and seeds notification types for the full
-- verification flow (prompt, completion, red-flag admin alerts).
-- Run order: 0042 → 0043.

-- ---------------------------------------------------------------------------
-- caregiver_profiles: store the permanent Authenticate userAccessCode
-- ---------------------------------------------------------------------------
alter table caregiver_profiles
  add column if not exists authenticate_user_code text;

-- ---------------------------------------------------------------------------
-- verifications: richer result storage + admin review tracking
-- ---------------------------------------------------------------------------
alter table verifications
  add column if not exists metadata            jsonb,
  add column if not exists admin_review_required boolean not null default false,
  add column if not exists reviewed_by         uuid references profiles (id) on delete set null,
  add column if not exists reviewed_at         timestamptz;

-- Unique constraint required for ON CONFLICT upserts in webhook handlers.
-- Drop first in case a prior partial migration left it.
alter table verifications
  drop constraint if exists verifications_user_type_unique;
alter table verifications
  add constraint verifications_user_type_unique unique (user_id, type);

-- ---------------------------------------------------------------------------
-- Notification types
-- ---------------------------------------------------------------------------
insert into notification_types (
  key, category, name, description,
  inapp_title, inapp_body,
  cc_admin, available_vars, sort_order
)
values
  (
    'caregiver.verify_prompt',
    'general',
    'Get Verified — post-onboarding nudge',
    'Sent after a paid-work caregiver completes onboarding.',
    'Build trust with verified status',
    'Getting verified helps families find you faster. Complete identity verification to show a Verified badge on your profile.',
    false,
    '[{"token":"link","label":"Verification link"}]'::jsonb,
    100
  ),
  (
    'caregiver.identity_verified',
    'general',
    'Identity Verified',
    'Sent when Authenticate confirms the caregiver''s identity.',
    'Identity verified!',
    'Your identity has been verified. Your profile now shows a Verified badge — families can see you''re a trusted caregiver.',
    false,
    '[]'::jsonb,
    101
  ),
  (
    'caregiver.background_check_complete',
    'general',
    'Background Check Complete',
    'Sent when the background check finishes with no issues.',
    'Background check complete',
    'Your background check is complete. Your profile now shows a Background Checked badge.',
    false,
    '[]'::jsonb,
    102
  ),
  (
    'admin.verification_red_flag',
    'general',
    'Admin: Verification Red Flag',
    'Sent to all admins when a caregiver triggers a sex-offender match (auto-deactivated).',
    'Verification Red Flag — Action Required',
    'Caregiver {{caregiver_name}} ({{caregiver_email}}) has triggered a red flag: {{flag_type}}. Their profile has been {{action_taken}}. Review at /admin/verifications.',
    false,
    '[{"token":"caregiver_name","label":"Caregiver name"},{"token":"caregiver_email","label":"Caregiver email"},{"token":"flag_type","label":"Flag type"},{"token":"action_taken","label":"Action taken"}]'::jsonb,
    103
  ),
  (
    'admin.verification_review_required',
    'general',
    'Admin: Background Check Needs Review',
    'Sent to all admins when a criminal record check returns records and needs manual review.',
    'Background check needs your review',
    'Caregiver {{caregiver_name}} ({{caregiver_email}}) has a background check with records found. Review and decide at /admin/verifications.',
    false,
    '[{"token":"caregiver_name","label":"Caregiver name"},{"token":"caregiver_email","label":"Caregiver email"}]'::jsonb,
    104
  ),
  (
    'parent.caregiver_unavailable',
    'general',
    'Caregiver No Longer Available',
    'Sent to parents/orgs who had conversations with a deactivated caregiver (no reason disclosed).',
    'A caregiver is no longer available',
    'A caregiver you were in contact with ({{caregiver_name}}) is no longer available on The Raising Club.',
    false,
    '[{"token":"caregiver_name","label":"Caregiver name"}]'::jsonb,
    105
  )
on conflict (key) do nothing;
