-- 0010_public_profile_active.sql
-- Deactivated caregivers must not appear publicly. Re-define public_caregiver
-- to also require the account is not deactivated.

create or replace function public_caregiver(uid uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when c.is_published and p.deactivated_at is null then jsonb_build_object(
    'userId',             p.id,
    'firstName',          p.first_name,
    'lastInitial',        left(coalesce(p.last_name, ''), 1),
    'preferredName',      p.preferred_name,
    'zip',                p.zip_code,
    'avatarUrl',          p.avatar_url,
    'registeredAt',       p.registered_at,
    'headline',           c.headline,
    'about',              c.about,
    'experienceLevel',    c.experience_level,
    'lookingForPaidWork', c.looking_for_paid_work,
    'idVerified',         exists (
      select 1 from verifications v
      where v.user_id = p.id and v.type = 'identity' and v.status = 'verified'
    )
  ) else null end
  from profiles p
  join caregiver_profiles c on c.user_id = p.id
  where p.id = uid;
$$;
