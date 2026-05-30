-- 0008_public_profile.sql
-- Public-safe caregiver profile accessor. `profiles` is owner-only by RLS
-- (keeps email/phone private), so visitors read name/headline via this
-- SECURITY DEFINER function which returns ONLY published, non-sensitive fields
-- (last name reduced to an initial; no email/phone/address).

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

grant execute on function public_caregiver(uuid) to anon, authenticated;
