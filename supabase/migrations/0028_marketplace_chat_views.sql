-- 0028_marketplace_chat_views.sql
-- Read accessors for the Chat inbox/thread. Messages + conversations are
-- participant-readable by RLS (0025), but each peer's display name/avatar lives
-- on `profiles` (owner-only), so we expose a public-safe slice through these
-- SECURITY DEFINER functions (last name → initial, like public_caregiver).
-- Run order: 0027 -> 0028.

-- One inbox row per conversation the caller is in: peer(s), last message, unread.
create or replace function marketplace_conversations()
returns setof jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'conversationId', c.id,
    'lastMessageAt',  c.last_message_at,
    'contextType',    c.context_type,
    'lastMessage',    (select m.body from messages m where m.conversation_id = c.id order by m.created_at desc limit 1),
    'lastSenderId',   (select m.sender_user_id from messages m where m.conversation_id = c.id order by m.created_at desc limit 1),
    'unreadCount', (
      select count(*) from messages m
      where m.conversation_id = c.id
        and m.sender_user_id is distinct from auth.uid()
        and (cp.last_read_at is null or m.created_at > cp.last_read_at)
    ),
    'peers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'userId',    p.id,
        'name',      coalesce(nullif(p.preferred_name, ''), nullif(p.first_name, ''), 'Member')
                     || case when nullif(p.last_name, '') is not null then ' ' || left(p.last_name, 1) || '.' else '' end,
        'avatarUrl', p.avatar_url,
        'role',      p.role
      ))
      from conversation_participants pp
      join profiles p on p.id = pp.user_id
      where pp.conversation_id = c.id and pp.user_id is distinct from auth.uid()
    ), '[]'::jsonb)
  )
  from conversations c
  join conversation_participants cp on cp.conversation_id = c.id and cp.user_id = auth.uid()
  order by c.last_message_at desc;
$$;
grant execute on function marketplace_conversations() to authenticated;

-- The other participant(s) of a single conversation (for the thread header).
-- Returns null if the caller isn't a participant.
create or replace function conversation_peers(cid uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when is_conversation_participant(cid) then coalesce((
    select jsonb_agg(jsonb_build_object(
      'userId',    p.id,
      'name',      coalesce(nullif(p.preferred_name, ''), nullif(p.first_name, ''), 'Member')
                   || case when nullif(p.last_name, '') is not null then ' ' || left(p.last_name, 1) || '.' else '' end,
      'avatarUrl', p.avatar_url,
      'role',      p.role
    ))
    from conversation_participants pp
    join profiles p on p.id = pp.user_id
    where pp.conversation_id = cid and pp.user_id is distinct from auth.uid()
  ), '[]'::jsonb) else null end;
$$;
grant execute on function conversation_peers(uuid) to authenticated;
