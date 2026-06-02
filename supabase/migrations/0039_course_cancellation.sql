-- Course purchase cancellation + refund (paid courses only, within 48h of
-- purchase). Mirrors the events cancel/refund flow.
--
-- NOTE: the new enum value must be committed before it can be used, so this is
-- applied in two steps (the runner / execute_sql commits per statement).

-- 1) New enrollment status.
alter type course_enrollment_status add value if not exists 'cancelled';

-- 2) Persist the purchase so it can be refunded later (course_enrollments is the
--    entitlement; events used a separate event_payments table, but a course
--    purchase is 1:1 with its enrollment so we keep it inline).
alter table course_enrollments
  add column if not exists amount_cents            integer,
  add column if not exists currency                text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists paid_at                 timestamptz,
  add column if not exists cancelled_at            timestamptz,
  add column if not exists refunded_amount_cents   integer not null default 0;

-- 3) Notification fired when a course purchase is cancelled / refunded.
insert into notification_types
  (key, category, name, description, inapp_enabled, email_enabled,
   inapp_title, inapp_body, email_subject, email_body, cc_admin, available_vars, sort_order)
values
  ('course.cancelled', 'courses', 'Course purchase cancelled',
   'A paid course purchase is cancelled and refunded (user self-cancel or admin).',
   true, false,
   'Course purchase cancelled',
   'Your purchase of {{course_name}} has been cancelled and {{amount}} refunded.',
   '', '',
   false,
   '[{"token":"user_firstname","label":"User first name"},{"token":"course_name","label":"Course name"},{"token":"amount","label":"Refunded amount"}]'::jsonb,
   70)
on conflict (key) do nothing;
