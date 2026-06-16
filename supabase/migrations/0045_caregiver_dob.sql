-- 0045_caregiver_dob.sql
-- Authenticate.com's /user/create API requires a date of birth.
-- We store it on caregiver_profiles so we only ask once and reuse on retries.
-- Field is nullable — only populated when the caregiver initiates verification.
-- Run order: 0044 -> 0045.

alter table caregiver_profiles
  add column if not exists date_of_birth date;
