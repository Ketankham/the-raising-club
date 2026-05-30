-- 0016_staff_invites.sql — accept-invitation + member-listing for org teams.

-- Accept a staff invitation: validate token, add the current user to the org,
-- mark the invitation accepted. Returns org_id (or null if invalid/expired).
create or replace function accept_staff_invitation(invite_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
  uid uuid := auth.uid();
begin
  if uid is null then return null; end if;
  select * into inv from staff_invitations
    where token = invite_token and status = 'pending' and expires_at > now();
  if not found then return null; end if;

  insert into organization_members (org_id, user_id, member_role, status)
    values (inv.org_id, uid, 'staff', 'active')
    on conflict (org_id, user_id) do update set status = 'active';

  update staff_invitations set status = 'accepted' where id = inv.id;
  return inv.org_id;
end;
$$;
grant execute on function accept_staff_invitation(uuid) to authenticated;

-- Member list (with profile name/email) for a manager — profiles is owner-only
-- by RLS, so this SECURITY DEFINER function returns members only to org members.
create or replace function org_members_list(target_org uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when exists (
      select 1 from organization_members m
      where m.org_id = target_org and m.user_id = auth.uid() and m.status = 'active'
    ) then coalesce((
      select jsonb_agg(jsonb_build_object(
        'userId', p.id,
        'name', coalesce(p.preferred_name, p.first_name, p.email),
        'email', p.email,
        'role', m.member_role,
        'status', m.status
      ) order by m.created_at)
      from organization_members m join profiles p on p.id = m.user_id
      where m.org_id = target_org
    ), '[]'::jsonb)
    else null end;
$$;
grant execute on function org_members_list(uuid) to authenticated;
