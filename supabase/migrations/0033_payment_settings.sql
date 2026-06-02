-- 0033_payment_settings.sql
-- Admin-configurable Stripe credentials so the owner can paste demo (test) or
-- real (live) keys from the panel and flip between them with no redeploy.
--
-- SECURITY: secret + webhook keys are read ONLY server-side via the service-role
-- client (src/lib/supabase/admin.ts) or by an admin via requireAdmin. RLS locks
-- the table to admins; there is NO public/anon read and NO RPC that returns the
-- secrets. The admin UI masks secrets (shows last 4) and only overwrites a column
-- when a fresh value is submitted. Publishable keys are public by design.
--
-- Singleton row (id = 1). env vars remain a bootstrap fallback (see settings.ts).
-- Run order: 0032 -> 0033.

create table if not exists payment_settings (
  id                    smallint primary key default 1 check (id = 1),
  mode                  text not null default 'test' check (mode in ('test', 'live')),
  test_publishable_key  text,
  test_secret_key       text,
  test_webhook_secret   text,
  live_publishable_key  text,
  live_secret_key       text,
  live_webhook_secret   text,
  updated_by            uuid references profiles (id) on delete set null,
  updated_at            timestamptz not null default now()
);

create trigger payment_settings_set_updated_at
  before update on payment_settings
  for each row execute function set_updated_at();

-- Seed the singleton so there is always exactly one row to update.
insert into payment_settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- RLS — admins only. Service-role bypasses RLS (webhook / checkout reads).
-- ---------------------------------------------------------------------------
alter table payment_settings enable row level security;

create policy payment_settings_admin_all on payment_settings
  for all using (is_admin()) with check (is_admin());
