-- Risk score fields on profiles (all roles).
-- Populated by the Authenticate risk-match check run at signup/onboarding.
alter table profiles
  add column if not exists risk_score       int,            -- 0-100 from Authenticate
  add column if not exists risk_flagged     boolean not null default false,  -- score >= 67
  add column if not exists risk_checked_at  timestamptz;

-- Also store the Authenticate user code on profiles so we can reuse it
-- for non-caregiver flows. Caregivers still use caregiver_profiles.authenticate_user_code;
-- this column is primarily for parent / org risk checks.
alter table profiles
  add column if not exists authenticate_user_code text;

comment on column profiles.risk_score      is 'Authenticate risk-match score (0=low risk, 99=high risk)';
comment on column profiles.risk_flagged    is 'True when risk_score >= 67 — account queued for admin review';
comment on column profiles.authenticate_user_code is 'Authenticate userAccessCode for non-caregiver users';
