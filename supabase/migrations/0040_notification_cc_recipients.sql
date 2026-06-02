-- 0040_notification_cc_recipients.sql
-- Make the EMAIL CC recipients of each notification type configurable from the
-- admin panel, instead of the single hardcoded cc_admin -> theraisingclub.tech.
--
-- The primary recipient (To) is always the notification's user. On top of that,
-- admins can now configure who else is CC'd per type:
--   * cc_all_admins  — CC every active admin-role account, resolved at send time.
--   * cc_emails      — an explicit list of extra addresses (jsonb array of text).
--
-- Backward-compatible: the legacy cc_admin boolean column is KEPT (the currently
-- deployed production code still writes it) but is no longer read by
-- create_notification. We backfill cc_emails from it once so existing behaviour
-- is preserved. A later migration can drop cc_admin after main is updated.

-- ---------------------------------------------------------------------------
-- New configurable CC columns
-- ---------------------------------------------------------------------------
alter table notification_types
  add column if not exists cc_all_admins boolean not null default false;

alter table notification_types
  add column if not exists cc_emails jsonb not null default '[]'::jsonb;

-- One-time backfill: anything that used the old cc_admin flag keeps CCing the
-- previous hardcoded address, now as an explicit configurable entry.
do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_name = 'notification_types' and column_name = 'cc_admin'
  ) then
    update notification_types
       set cc_emails = '["theraisingclub.tech@gmail.com"]'::jsonb
     where cc_admin = true
       and (cc_emails is null or cc_emails = '[]'::jsonb);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- create_notification(): now builds the CC list from the configurable fields.
-- To = the recipient's email (unchanged). CC = configured explicit addresses
-- plus, when cc_all_admins is set, every active admin — deduped, blanks dropped,
-- and never including the primary recipient.
-- ---------------------------------------------------------------------------
create or replace function create_notification(
  p_user_id  uuid,
  p_type_key text,
  p_vars     jsonb default '{}'::jsonb,
  p_link     text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  t          notification_types%rowtype;
  v_notif_id uuid;
  v_email    text;
  v_cc       text;
begin
  select * into t from notification_types where key = p_type_key;
  if not found then
    raise exception 'unknown notification type: %', p_type_key;
  end if;

  -- In-app channel
  if t.inapp_enabled then
    insert into notifications (user_id, type_key, category, title, body, link, payload)
    values (
      p_user_id,
      p_type_key,
      t.category,
      render_template(t.inapp_title, p_vars),
      render_template(t.inapp_body, p_vars),
      p_link,
      coalesce(p_vars, '{}'::jsonb)
    )
    returning id into v_notif_id;
  end if;

  -- Email channel (PARKED: record intent as 'skipped' until a provider is wired)
  if t.email_enabled then
    select email into v_email from profiles where id = p_user_id;

    select string_agg(addr, ', ')
      into v_cc
      from (
        select distinct lower(trim(a)) as addr
          from (
            -- explicit admin-configured addresses
            select jsonb_array_elements_text(coalesce(t.cc_emails, '[]'::jsonb)) as a
            union all
            -- every active admin, when enabled
            select p.email as a
              from profiles p
             where t.cc_all_admins
               and p.role = 'admin'
               and p.deactivated_at is null
               and p.email is not null
          ) raw
         where a is not null
           and length(trim(a)) > 0
           and lower(trim(a)) <> lower(coalesce(trim(v_email), ''))
      ) deduped;

    insert into notification_emails (notification_id, to_email, cc, subject, body_html, status)
    values (
      v_notif_id,
      v_email,
      nullif(v_cc, ''),
      render_template(t.email_subject, p_vars),
      render_template(t.email_body, p_vars),
      'skipped'
    );
  end if;

  return v_notif_id;
end;
$$;

grant execute on function create_notification(uuid, text, jsonb, text) to authenticated;
