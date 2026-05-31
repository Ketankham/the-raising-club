-- 0025_marketplace_saves_chat.sql
-- Marketplace · (1) saves/favorites (the heart on every card) and (2) Chat —
-- generic 1:1 conversations between any two users (caregiver↔caregiver,
-- parent↔parent, parent↔caregiver), optionally anchored to a job / listing /
-- profile / invite / application. Generalizes the two-way event_messages pattern
-- (events are NOT migrated onto this yet). Decision 4: build chat now, 1:1 only.
-- Reuses: profiles, is_admin(). Run order: 0024 -> 0025.

-- ===========================================================================
-- 1. Saves / favorites
-- ===========================================================================
create type marketplace_target as enum ('caregiver', 'family', 'job');

create table marketplace_saves (
  saver_user_id uuid not null references profiles (id) on delete cascade,
  target_type   marketplace_target not null,
  target_id     uuid not null,                 -- caregiver user_id | family user_id | job id
  created_at    timestamptz not null default now(),
  primary key (saver_user_id, target_type, target_id)
);
create index marketplace_saves_target_idx on marketplace_saves (target_type, target_id);

alter table marketplace_saves enable row level security;
create policy marketplace_saves_own on marketplace_saves
  for all using (saver_user_id = auth.uid()) with check (saver_user_id = auth.uid());
create policy marketplace_saves_admin_read on marketplace_saves
  for select using (is_admin());

-- ===========================================================================
-- 2. Chat
-- ===========================================================================
create type conversation_kind as enum ('direct');   -- group/playdate threads later

create table conversations (
  id            uuid primary key default gen_random_uuid(),
  kind          conversation_kind not null default 'direct',
  -- optional anchor so a thread can be opened "about" something:
  context_type  text check (context_type in ('job','caregiver','family','invitation','application')),
  context_id    uuid,
  created_by    uuid references profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
create index conversations_recent_idx on conversations (last_message_at desc);

create table conversation_participants (
  conversation_id uuid not null references conversations (id) on delete cascade,
  user_id         uuid not null references profiles (id) on delete cascade,
  last_read_at    timestamptz,
  archived_at     timestamptz,
  joined_at       timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index conv_participants_user_idx on conversation_participants (user_id);

create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender_user_id  uuid references profiles (id) on delete set null,
  body            text not null,
  created_at      timestamptz not null default now()
);
create index messages_thread_idx on messages (conversation_id, created_at);

-- Participant check as SECURITY DEFINER to avoid RLS recursion between
-- conversations / participants / messages policies.
create or replace function is_conversation_participant(target_conversation uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_participants p
    where p.conversation_id = target_conversation and p.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table conversations              enable row level security;
alter table conversation_participants  enable row level security;
alter table messages                   enable row level security;

-- conversations: participants read; creator can read back (covers the RPC's own
-- inserts and is snapshot-independent — 0022 guardrail). Updated by participants
-- (bump last_message_at). No direct client INSERT — use the RPC below.
create policy conversations_read on conversations
  for select using (created_by = auth.uid() or is_conversation_participant(id) or is_admin());
create policy conversations_update on conversations
  for update using (is_conversation_participant(id)) with check (is_conversation_participant(id));

-- participants: a user sees rows for conversations they're in; manages own row
-- (mark read / archive). New participants are added by the RPC (definer).
create policy conv_participants_read on conversation_participants
  for select using (user_id = auth.uid() or is_conversation_participant(conversation_id) or is_admin());
create policy conv_participants_self on conversation_participants
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- messages: participants read; participants insert as themselves.
create policy messages_read on messages
  for select using (is_conversation_participant(conversation_id) or is_admin());
create policy messages_insert on messages
  for insert with check (
    sender_user_id = auth.uid() and is_conversation_participant(conversation_id)
  );

-- ---------------------------------------------------------------------------
-- get_or_create_direct_conversation : dedupe the 1:1 thread between the caller
-- and `other_user`. Creates conversation + both participant rows atomically,
-- bypassing the no-direct-INSERT policy on conversations.
-- ---------------------------------------------------------------------------
create or replace function get_or_create_direct_conversation(
  other_user uuid,
  ctx_type   text default null,
  ctx_id     uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me  uuid := auth.uid();
  cid uuid;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;
  if other_user is null or other_user = me then
    raise exception 'invalid other_user';
  end if;

  -- Find an existing direct thread that has exactly these two participants.
  select c.id into cid
  from conversations c
  where c.kind = 'direct'
    and exists (select 1 from conversation_participants p
                where p.conversation_id = c.id and p.user_id = me)
    and exists (select 1 from conversation_participants p
                where p.conversation_id = c.id and p.user_id = other_user)
    and (select count(*) from conversation_participants p where p.conversation_id = c.id) = 2
  limit 1;

  if cid is not null then
    return cid;
  end if;

  insert into conversations (kind, context_type, context_id, created_by)
  values ('direct', ctx_type, ctx_id, me)
  returning id into cid;

  insert into conversation_participants (conversation_id, user_id)
  values (cid, me), (cid, other_user);

  return cid;
end;
$$;

-- Bump last_message_at whenever a message lands (keeps the inbox ordered).
create or replace function bump_conversation_last_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;
create trigger messages_bump_conversation
  after insert on messages
  for each row execute function bump_conversation_last_message();
