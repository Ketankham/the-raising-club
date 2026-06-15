-- 0044_verification_rpcs.sql
-- Update marketplace_caregiver_cards() and public_caregiver() to:
--   1. Fix idVerified bug: was checking any verified row; now pinned to type='identity'.
--   2. Add backgroundCheckVerified field (type='background_check').
--   3. Respect valid_until expiry on both badge types.
-- Run order: 0043 -> 0044.

-- ---------------------------------------------------------------------------
-- marketplace_caregiver_cards() — browse grid (authenticated only)
-- ---------------------------------------------------------------------------
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
      select 1 from verifications v
      where v.user_id = p.id
        and v.type = 'identity'
        and v.status = 'verified'
        and (v.valid_until is null or v.valid_until > current_date)
    ),
    'backgroundCheckVerified', exists (
      select 1 from verifications v
      where v.user_id = p.id
        and v.type = 'background_check'
        and v.status = 'verified'
        and v.admin_review_required = false
        and (v.valid_until is null or v.valid_until > current_date)
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

-- ---------------------------------------------------------------------------
-- public_caregiver(uid) — public profile page (anon + authenticated)
-- ---------------------------------------------------------------------------
create or replace function public_caregiver(uid uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when c.is_published then jsonb_build_object(
    'userId',             p.id,
    'firstName',          p.first_name,
    'lastInitial',        left(coalesce(p.last_name, ''), 1),
    'preferredName',      p.preferred_name,
    'zip',                p.zip_code,
    'avatarUrl',          p.avatar_url,
    'registeredAt',       p.registered_at,
    'locale',             p.locale,
    'headline',           c.headline,
    'about',              c.about,
    'experienceLevel',    c.experience_level,
    'lookingForPaidWork', c.looking_for_paid_work,
    'idVerified', exists (
      select 1 from verifications v
      where v.user_id = p.id
        and v.type = 'identity'
        and v.status = 'verified'
        and (v.valid_until is null or v.valid_until > current_date)
    ),
    'backgroundCheckVerified', exists (
      select 1 from verifications v
      where v.user_id = p.id
        and v.type = 'background_check'
        and v.status = 'verified'
        and v.admin_review_required = false
        and (v.valid_until is null or v.valid_until > current_date)
    )
  ) else null end
  from profiles p
  join caregiver_profiles c on c.user_id = p.id
  where p.id = uid;
$$;

grant execute on function public_caregiver(uuid) to anon, authenticated;
