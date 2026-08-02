-- 0047_event_checkin.sql
-- QR check-in: organizers/admin display one QR code per event (poster at the
-- venue) that encodes /events/[slug]/check-in. A registered participant scans
-- it, signs in if needed, and self-confirms attendance. No token/secret is
-- needed beyond the event slug (already public) — the write is scoped to the
-- caller's own registration via the existing `event_reg_owner` RLS policy
-- (`registrant_user_id = auth.uid()`), so no new policy is required.
-- Attendance-only: no reward semantics here (contrast with per-child
-- attendance_status, which stays organizer/roster-driven).
-- Run order: 0046 -> 0047.

alter table event_registrations
  add column if not exists checked_in_at timestamptz;

comment on column event_registrations.checked_in_at is
  'Set when the registrant self-confirms attendance via the event QR check-in link.';
