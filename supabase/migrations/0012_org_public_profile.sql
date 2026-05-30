-- 0012_org_public_profile.sql — public, discoverable organization profile.
alter table organizations add column if not exists is_published boolean not null default false;

-- Public-safe org accessor (returns null unless published). Bundles locations
-- so visitors never need member-only table reads.
create or replace function public_organization(uid uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when o.is_published then jsonb_build_object(
    'orgId',        o.id,
    'name',         o.name,
    'about',        o.about,
    'programTypes', o.program_types,
    'agesServed',   o.ages_served,
    'size',         o.size,
    'multiLocation',o.multi_location,
    'locations',    coalesce((
      select jsonb_agg(jsonb_build_object('label', l.label, 'zip', l.zip_code) order by l.is_primary desc)
      from organization_locations l where l.org_id = o.id), '[]'::jsonb)
  ) else null end
  from organizations o
  where o.id = uid;
$$;

grant execute on function public_organization(uuid) to anon, authenticated;
