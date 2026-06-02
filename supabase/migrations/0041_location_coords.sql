-- 0041_location_coords.sql
-- Add lat/lng to profiles and organization_locations so we can do real
-- distance-based sorting in the marketplace and events grid. Coordinates are
-- captured via Google Places Autocomplete on the client (no server geocoding).
-- Also updates marketplace_caregiver_cards() to expose lat/lng for JS sorting.
-- Run order: 0040 -> 0041.

alter table profiles
  add column if not exists lat double precision,
  add column if not exists lng double precision;

alter table organization_locations
  add column if not exists lat double precision,
  add column if not exists lng double precision;

-- Recreate with lat/lng added (preserve all existing fields).
create or replace function marketplace_caregiver_cards()
returns setof jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'userId',             p.id,
    'firstName',          p.first_name,
    'lastInitial',        left(coalesce(p.last_name, ''), 1),
    'preferredName',      p.preferred_name,
    'zip',                p.zip_code,
    'lat',                p.lat,
    'lng',                p.lng,
    'avatarUrl',          p.avatar_url,
    'headline',           c.headline,
    'about',              c.about,
    'experienceLevel',    c.experience_level,
    'rateAmount',         c.rate_amount,
    'rateUnit',           c.rate_unit,
    'lookingForPaidWork', c.looking_for_paid_work,
    'idVerified', exists (
      select 1 from verifications v where v.user_id = p.id and v.status = 'verified'
    ),
    'ratingAvg', (
      select round(avg(r.rating)::numeric, 1)
      from caregiver_reviews r where r.caregiver_user_id = p.id and r.is_published
    ),
    'ratingCount', (
      select count(*) from caregiver_reviews r
      where r.caregiver_user_id = p.id and r.is_published
    ),
    'skills', coalesce((
      select jsonb_agg(s.label order by s.label)
      from caregiver_skill_selections sel
      join skills s on s.id = sel.skill_id
      where sel.user_id = p.id
    ), '[]'::jsonb),
    'ageGroups', coalesce((
      select jsonb_agg(distinct ag.age) from caregiver_age_groups ag where ag.user_id = p.id
    ), '[]'::jsonb),
    'careSettings', coalesce((
      select jsonb_agg(distinct cs.setting) from caregiver_care_settings cs where cs.user_id = p.id
    ), '[]'::jsonb)
  )
  from caregiver_profiles c
  join profiles p on p.id = c.user_id
  where c.is_published
  order by p.registered_at desc nulls last;
$$;
grant execute on function marketplace_caregiver_cards() to authenticated;
