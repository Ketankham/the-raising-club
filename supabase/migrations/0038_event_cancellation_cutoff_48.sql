-- Cancellation policy: users can self-cancel up to 48 hours before the event
-- (was 12). Bump the per-event default and backfill events still on the old
-- default. cancellation_cutoff_hours stays configurable per event in the admin
-- form, so hosts can override.

alter table events alter column cancellation_cutoff_hours set default 48;

update events
set cancellation_cutoff_hours = 48
where cancellation_cutoff_hours = 12;
