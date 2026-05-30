-- 0021_public_course_credentials.sql
-- Surfacing course outcomes on the PUBLIC caregiver profile / marketplace.
-- Earned skills already read publicly (caregiver_skill_selections has a
-- published-profile read policy + skills is public-read). Issued certificates,
-- however, are owner/admin-only (see 0020), so a visitor can't read them.
-- This SECURITY DEFINER function exposes a SAFE subset of a published
-- caregiver's certificates (no verify_token, no enrollment) for their profile.
-- Run order: 0020 -> 0021.

create or replace function public_caregiver_certificates(uid uuid)
returns table (
  certificate_id text,
  course_title   text,
  course_slug    text,
  issued_at      timestamptz
)
language sql stable security definer set search_path = public as $$
  select c.certificate_id, c.course_title, co.slug, c.issued_at
  from certificates c
  join courses co on co.id = c.course_id
  where c.user_id = uid
    and c.revoked_at is null
    and exists (
      select 1 from caregiver_profiles cp
      where cp.user_id = uid and cp.is_published
    )
  order by c.issued_at desc;
$$;

grant execute on function public_caregiver_certificates(uuid) to anon, authenticated;
