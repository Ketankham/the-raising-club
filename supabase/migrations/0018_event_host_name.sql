-- 0018_event_host_name.sql
-- Denormalized organizer display name on the event, so the list + detail screens
-- can show "Hosted by …" without extra joins. Populated on create/update by the
-- app: the organization's name when the host belongs to an org, otherwise the
-- creator's own name (TRC for platform events).

alter table events add column if not exists host_name text;

-- Backfill existing rows.
update events e
   set host_name = o.name
  from organizations o
 where e.org_id = o.id and e.host_name is null;

update events
   set host_name = 'The Raising Club'
 where org_id is null and host_name is null;
