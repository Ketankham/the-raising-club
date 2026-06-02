-- 0037_billing_notifications.sql
-- Notification catalog entries for payment / subscription / household events.
-- Emitted from the Stripe webhook (service-role create_notification) and the
-- household accept flow. In-app on; email parked (off) like the rest of 0032.
-- Run order: 0036 -> 0037.

insert into notification_types
  (key, category, name, description, inapp_enabled, email_enabled, cc_admin,
   inapp_title, inapp_body, email_subject, email_body, available_vars, sort_order)
values
  ('event.payment_received', 'events', 'Event payment received',
   'A user completes payment for a paid event.',
   true, false, false,
   'Payment received ✅',
   'Your payment for {{eventName}} is confirmed — you''re all set. See you there!',
   '', '',
   '[{"token":"eventName","label":"Event name"}]'::jsonb,
   60),

  ('course.purchased', 'courses', 'Course purchased',
   'A learner completes payment for a paid course.',
   true, false, false,
   'You''re enrolled 🎓',
   'Your purchase of {{courseName}} is complete. Jump in whenever you''re ready!',
   '', '',
   '[{"token":"courseName","label":"Course name"}]'::jsonb,
   25),

  ('subscription.activated', 'general', 'Membership activated',
   'A subscription becomes active after checkout.',
   true, false, false,
   'Membership active 🎉',
   'Your {{planName}} membership is now active. Welcome aboard!',
   '', '',
   '[{"token":"planName","label":"Plan name"}]'::jsonb,
   70),

  ('subscription.payment_failed', 'general', 'Membership payment failed',
   'A subscription invoice payment fails.',
   true, false, false,
   'Payment issue ⚠️',
   'We couldn''t process the payment for your {{planName}} membership. Please update your billing details to keep your access.',
   '', '',
   '[{"token":"planName","label":"Plan name"}]'::jsonb,
   71),

  ('subscription.canceled', 'general', 'Membership canceled',
   'A subscription is canceled or ends.',
   true, false, false,
   'Membership ended',
   'Your {{planName}} membership has ended. You can resubscribe any time from Settings.',
   '', '',
   '[{"token":"planName","label":"Plan name"}]'::jsonb,
   72),

  ('household.member_joined', 'general', 'Family member joined',
   'An invited adult accepts and joins the household.',
   true, false, false,
   'A family member joined 👋',
   '{{memberName}} has joined your Raising Club.',
   '', '',
   '[{"token":"memberName","label":"Member name"}]'::jsonb,
   80)

on conflict (key) do nothing;
