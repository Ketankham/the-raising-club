// Provision dedicated QA login accounts (one per role) with a known password.
// Creates auth.users + auth.identities directly (bcrypt via pgcrypto, no emails —
// signup is email-rate-limited), confirms them, sets roles, then VERIFIES login.
// Re-runnable (resets the password on existing rows). Run:
//   node --env-file=.env.local scripts/create-qa-users.mjs
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const dbpw = process.env.SUPABASE_DB_PASSWORD;
if (!url || !key || !dbpw) { console.error("Missing env"); process.exit(1); }

// Password is taken from env so it is NOT committed (web/ is a public repo).
// The actual value lives in the local, un-committed qa-creds.md.
//   PowerShell:  $env:QA_PASSWORD="..."; node --env-file=.env.local scripts/create-qa-users.mjs
const QA_PASSWORD = process.env.QA_PASSWORD;
if (!QA_PASSWORD) { console.error("Set QA_PASSWORD (see qa-creds.md)"); process.exit(1); }
const USERS = [
  { email: "qa-admin@raisingclub-test.dev", role: "admin", first: "QA", last: "Admin" },
  { email: "qa-org@raisingclub-test.dev", role: "organization", first: "QA", last: "Org" },
  { email: "qa-parent@raisingclub-test.dev", role: "parent", first: "QA", last: "Parent" },
  { email: "qa-caregiver@raisingclub-test.dev", role: "caregiver", first: "QA", last: "Caregiver" },
];

const sb = createClient(url, key, { auth: { persistSession: false } });
const c = new pg.Client({
  host: "db.xocomzqhlciukgodjptr.supabase.co",
  port: 5432, user: "postgres", password: dbpw, database: "postgres",
  ssl: { rejectUnauthorized: false },
});
await c.connect();

async function ensureUser(email) {
  let id;
  const found = await c.query("select id from auth.users where email=$1", [email]);
  if (found.rows.length) {
    id = found.rows[0].id;
    await c.query(
      "update auth.users set encrypted_password = crypt($2, gen_salt('bf')), email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now() where id=$1",
      [id, QA_PASSWORD],
    );
  } else {
    const ins = await c.query(
      `insert into auth.users
         (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
          raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token,
          email_change, email_change_token_new, created_at, updated_at)
       values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated',
          'authenticated', $1, crypt($2, gen_salt('bf')), now(),
          '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, '', '', '', '', now(), now())
       returning id`,
      [email, QA_PASSWORD],
    );
    id = ins.rows[0].id;
  }
  // Ensure an email identity exists (idempotent).
  await c.query(
    `insert into auth.identities (id, user_id, provider, provider_id, identity_data, last_sign_in_at, created_at, updated_at)
     values (gen_random_uuid(), $1::uuid, 'email', $1, jsonb_build_object('sub', $1, 'email', $2::text), now(), now(), now())
     on conflict do nothing`,
    [id, email],
  );
  return id;
}

for (const u of USERS) {
  const id = await ensureUser(u.email);
  await c.query(
    `update profiles set role=$2, first_name=$3, last_name=$4,
       onboarding_completed_at = coalesce(onboarding_completed_at, now()),
       registered_at = coalesce(registered_at, now())
     where id=$1`,
    [id, u.role, u.first, u.last],
  );
  if (u.role === "organization") {
    let orgId = (await c.query("select id from organizations where owner_user_id=$1", [id])).rows[0]?.id;
    if (!orgId) {
      orgId = (await c.query(
        "insert into organizations (name, owner_user_id, is_published) values ('QA Test Org', $1, true) returning id",
        [id],
      )).rows[0].id;
    }
    await c.query(
      "insert into organization_members (org_id, user_id, member_role, status) values ($1,$2,'owner','active') on conflict do nothing",
      [orgId, id],
    );
  }

  const v = await sb.auth.signInWithPassword({ email: u.email, password: QA_PASSWORD });
  console.log(`${v.error ? "✗" : "✓"} ${u.email.padEnd(34)} ${u.role.padEnd(13)} ${v.error ? "LOGIN FAIL: " + v.error.message : "login OK"}`);
  await sb.auth.signOut();
}

await c.end();
console.log(`\nAll QA accounts use password: ${QA_PASSWORD}`);
