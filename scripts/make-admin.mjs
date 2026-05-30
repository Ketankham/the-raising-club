// Creates an admin login (direct insert: bcrypt password + confirmed email) and
// a few sample users so the admin panel has data. Password printed at the end.
import pg from "pg";
import crypto from "node:crypto";

const a = new pg.Client({ host: "db.xocomzqhlciukgodjptr.supabase.co", port: 5432, user: "postgres", password: process.env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
await a.connect();

async function createUser(email, password, { confirmed = true } = {}) {
  const id = crypto.randomUUID();
  await a.query(
    `insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
       created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
       confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, reauthentication_token,
       is_sso_user, is_anonymous)
     values ($1,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',$2,
       crypt($3, gen_salt('bf')), ${confirmed ? "now()" : "null"}, now(), now(),
       '{"provider":"email","providers":["email"]}','{}','','','','','','', false, false)`,
    [id, email, password],
  );
  await a.query(
    `insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
     values ($1::text, $1::uuid, jsonb_build_object('sub',$1::text,'email',$2::text), 'email', now(), now(), now())`,
    [id, email],
  );
  return id;
}

// Admin — credentials from env (never hard-code into a public repo):
//   ADMIN_EMAIL=… ADMIN_PASSWORD=… SAMPLE_PASSWORD=… node scripts/make-admin.mjs
const adminEmail = process.env.ADMIN_EMAIL;
const adminPw = process.env.ADMIN_PASSWORD;
const samplePw = process.env.SAMPLE_PASSWORD ?? "ChangeMe#2026";
if (!adminEmail || !adminPw) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD");
  process.exit(1);
}
await a.query("delete from auth.users where email=$1", [adminEmail]);
const adminId = await createUser(adminEmail, adminPw);
await a.query("update profiles set role='admin', first_name='Ketan', last_name='K', preferred_name='Ketan', registered_at=now() where id=$1", [adminId]);

// Sample users
async function sample(email, role, { onboarded = false } = {}) {
  await a.query("delete from auth.users where email=$1", [email]);
  const id = await createUser(email, samplePw);
  const first = email.split("@")[0];
  await a.query("update profiles set role=$2, first_name=$3, registered_at=now()" + (onboarded ? ", onboarding_completed_at=now()" : "") + " where id=$1", [id, role, first]);
  await a.query("insert into onboarding_progress (user_id, role, current_step, status, completed_at) values ($1,$2,$3,$4,$5::timestamptz) on conflict (user_id) do nothing",
    [id, role, onboarded ? "complete" : "profile", onboarded ? "completed" : "in_progress", onboarded ? new Date().toISOString() : null]);
  return id;
}
await sample("sample.parent@example.com", "parent", { onboarded: true });
await sample("sample.caregiver@example.com", "caregiver", { onboarded: false });
await sample("sample.org@example.com", "organization", { onboarded: true });

console.log("admin created/updated:", adminEmail);
console.log("sample users created (3)");
await a.end();
