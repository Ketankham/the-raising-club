// Creates two throwaway test logins for manual/Playwright testing of courses:
//   - a test admin (course authoring)
//   - a test caregiver (learner flow + profile surfacing, published profile)
// Idempotent. Password from env TEST_PASSWORD (default below). Run:
//   node --env-file=.env.local scripts/make-test-users.mjs
import pg from "pg";
import crypto from "node:crypto";

const a = new pg.Client({ host: "db.xocomzqhlciukgodjptr.supabase.co", port: 5432, user: "postgres", password: process.env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
await a.connect();
const pw = process.env.TEST_PASSWORD ?? "TestPass#2026";

async function createUser(email) {
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
  return id;
}

const adminEmail = "courses-test-admin@raisingclub-test.dev";
const adminId = await createUser(adminEmail);
await a.query("update profiles set role='admin', first_name='Test', last_name='Admin', preferred_name='Test Admin', registered_at=now(), onboarding_completed_at=now() where id=$1", [adminId]);

const cgEmail = "courses-test-caregiver@raisingclub-test.dev";
const cgId = await createUser(cgEmail);
await a.query("update profiles set role='caregiver', first_name='Sarah', last_name='Lopez', preferred_name='Sarah', registered_at=now(), onboarding_completed_at=now() where id=$1", [cgId]);
await a.query("insert into caregiver_profiles (user_id, headline, about, is_published) values ($1,'Infant & Toddler Caregiver','I love supporting calm routines.',true) on conflict (user_id) do update set is_published=true", [cgId]);
await a.query("insert into onboarding_progress (user_id, role, current_step, status, completed_at) values ($1,'caregiver','complete','completed',now()) on conflict (user_id) do nothing", [cgId]);

console.log("Test users ready (password:", pw + ")");
console.log("  admin    :", adminEmail);
console.log("  caregiver:", cgEmail);
await a.end();
