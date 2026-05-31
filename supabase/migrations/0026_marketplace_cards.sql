-- 0026_marketplace_cards.sql
-- Browse-grid accessors for the marketplace. `profiles` is owner-only by RLS
-- (and `children` too), so the Find Caregivers / Connect Families grids read
-- public-safe card data through these SECURITY DEFINER functions — the same
-- pattern as public_caregiver() (0008). Each returns one jsonb per published
-- listing; the app filters/sorts in JS (like listEvents). authenticated only:
-- the marketplace is behind login.
-- Run order: 0025 -> 0026.

-- ---------------------------------------------------------------------------
-- Caregiver cards (Figma slides 1–2). Published caregivers + safe identity,
-- aggregate rating (published reviews), skills, age groups, care settings.
-- Last name reduced to an initial (privacy stance from public_caregiver).
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

-- ---------------------------------------------------------------------------
-- Family cards (Figma slide 3). Published family_listings + safe parent
-- identity, budget, schedule, traits, "open to", children COUNT (from the
-- owner-only `children` table), and the ages the family seeks care for.
-- ---------------------------------------------------------------------------
create or replace function marketplace_family_cards()
returns setof jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'userId',           p.id,
    'householdName',    coalesce(nullif(f.household_name, ''),
                                 'The ' || coalesce(nullif(p.last_name, ''), p.first_name, 'Family')),
    'headline',         f.headline,
    'about',            f.about,
    'careNeeds',        f.care_needs,
    'locationLabel',    coalesce(nullif(f.location_label, ''), p.zip_code),
    'zip',              coalesce(nullif(f.zip_code, ''), p.zip_code),
    'budgetMin',        f.budget_min,
    'budgetMax',        f.budget_max,
    'budgetUnit',       f.budget_unit,
    'careType',         f.care_type,
    'coverPhotoUrl',    coalesce(f.cover_photo_url, p.avatar_url),
    'coHireInterested', f.co_hire_interested,
    'childrenCount',    (select count(*) from children ch where ch.parent_user_id = p.id),
    'ageGroups', coalesce((
      select jsonb_agg(distinct a.age) from family_listing_age_groups a where a.user_id = p.id
    ), '[]'::jsonb),
    'schedule', coalesce((
      select jsonb_agg(distinct s.slot) from family_listing_schedule s where s.user_id = p.id
    ), '[]'::jsonb),
    'openTo', coalesce((
      select jsonb_agg(distinct o.kind) from family_listing_open_to o where o.user_id = p.id
    ), '[]'::jsonb),
    'traits', coalesce((
      select jsonb_agg(t.label order by t.label)
      from family_listing_traits lt join family_traits t on t.id = lt.trait_id
      where lt.user_id = p.id
    ), '[]'::jsonb)
  )
  from family_listings f
  join profiles p on p.id = f.user_id
  where f.is_published
  order by f.updated_at desc nulls last;
$$;
grant execute on function marketplace_family_cards() to authenticated;
