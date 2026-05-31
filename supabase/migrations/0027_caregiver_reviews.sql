-- 0027_caregiver_reviews.sql
-- Public review submission via tokened invitation. review_invitations and
-- caregiver_reviews are owner-only by RLS, so the (account-less) reviewer uses
-- these SECURITY DEFINER functions to read the invite + submit a review safely.

-- Validate a token + return the caregiver's display name for the review form.
create or replace function review_invitation_info(invite_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when i.status = 'invited' then jsonb_build_object(
    'valid', true,
    'caregiverName', coalesce(p.preferred_name, p.first_name, 'this caregiver'),
    'inviteeName', i.invitee_name,
    'relationship', i.relationship
  ) else jsonb_build_object('valid', false) end
  from review_invitations i
  join profiles p on p.id = i.caregiver_user_id
  where i.token = invite_token;
$$;
grant execute on function review_invitation_info(uuid) to anon, authenticated;

-- Submit a review against an invitation. Inserts unpublished (caregiver moderates).
create or replace function submit_review(
  invite_token uuid,
  p_reviewer_name text,
  p_relationship text,
  p_rating integer,
  p_body text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
begin
  select * into inv from review_invitations where token = invite_token and status = 'invited';
  if not found then return false; end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then return false; end if;

  insert into caregiver_reviews (caregiver_user_id, invitation_id, reviewer_name, relationship, rating, body, status, is_published)
  values (
    inv.caregiver_user_id, inv.id,
    coalesce(nullif(trim(p_reviewer_name), ''), inv.invitee_name),
    coalesce(nullif(trim(p_relationship), ''), inv.relationship),
    p_rating, nullif(trim(p_body), ''), 'submitted', false
  );

  update review_invitations set status = 'submitted' where id = inv.id;
  return true;
end;
$$;
grant execute on function submit_review(uuid, text, text, integer, text) to anon, authenticated;
