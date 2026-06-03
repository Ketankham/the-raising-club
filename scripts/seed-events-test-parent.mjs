// Seeds a confirmed PARENT login for recording the free-event registration +
// confirmation-notification flow (bypasses the Supabase email rate limit).
// Registered-but-not-onboarded so the "finish onboarding" banner shows and the
// register wizard skips the account step. Idempotent; also clears prior
// registrations/notifications for this user so re-runs are clean. Run:
//   node --env-file=.env.local scripts/seed-events-test-parent.mjs
import pg from "pg";
import crypto from "node:crypto";

const a = new pg.Client({ host: "db.xocomzqhlciukgodjptr.supabase.co", port: 5432, user: "postgres", password: process.env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
await a.connect();

const email = "events-test-parent@raisingclub-test.dev";
const pw = process.env.TEST_PASSWORD ?? "TestPass#2026";

await a.query("delete from auth.users where email=$1", [email]);
const id = crypto.randomUUID();
await a.query(
  `insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, reauthentication_token, is_sso_user, is_anonymous)
   values ($1,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',$2, crypt($3, gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{}','','','','','','', false, false)`,
  [id, email, pw],
);
await a.query(
  `insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
   values ($1::text, $1::uuid, jsonb_build_object('sub',$1::text,'email',$2::text), 'email', now(), now(), now())`,
  [id, email],
);

// Registered (so the register page skips account step), but NOT onboarded
// (so the site-wide banner shows). role=parent.
await a.query(
  "update profiles set role='parent', first_name='Riley', last_name='Parent', preferred_name='Riley', registered_at=now(), onboarding_completed_at=null, dashboard_tour_completed_at=now() where id=$1",
  [id],
);
// Mirror the register-first seed: resume lands at `goals`, account step done.
await a.query(
  `insert into onboarding_progress (user_id, role, flow_version, current_step, completed_steps, status)
   values ($1,'parent',1,'goals', array['role-select','ways-to-use','profile'], 'in_progress')
   on conflict (user_id) do update set role='parent', current_step='goals',
     completed_steps=array['role-select','ways-to-use','profile'], status='in_progress'`,
  [id],
);

console.log("Seeded parent:", email, "/", pw, "id:", id);
await a.end();
