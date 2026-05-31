// Persistent demo users for manual/Playwright marketplace testing. Idempotent.
//   node --env-file=.env.local scripts/seed-marketplace-demo.mjs
import pg from "pg";
import crypto from "node:crypto";
const c = new pg.Client({ host: "db.xocomzqhlciukgodjptr.supabase.co", port: 5432, user: "postgres", password: process.env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
await c.connect();
const q = (t, p) => c.query(t, p);
const pw = process.env.TEST_PASSWORD ?? "TestPass#2026";
async function mkUser(email) {
  await q("delete from auth.users where email=$1", [email]);
  const id = crypto.randomUUID();
  await q(`insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, reauthentication_token, is_sso_user, is_anonymous) values ($1,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',$2, crypt($3, gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{}','','','','','','', false, false)`, [id, email, pw]);
  await q(`insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) values ($1::text,$1::uuid, jsonb_build_object('sub',$1::text,'email',$2::text),'email',now(),now(),now())`, [id, email]);
  return id;
}
const parentEmail = "mkt-demo-parent@raisingclub-test.dev";
const parentId = await mkUser(parentEmail);
await q("update profiles set role='parent', first_name='Pat', last_name='Alvarez', preferred_name='Pat', zip_code='Brooklyn, NY', registered_at=now(), onboarding_completed_at=now() where id=$1", [parentId]);
await q("insert into parent_profiles (user_id) values ($1) on conflict do nothing", [parentId]);
await q("insert into onboarding_progress (user_id, role, current_step, status, completed_at) values ($1,'parent','complete','completed',now()) on conflict (user_id) do nothing", [parentId]);
await q("delete from job_posts where owner_user_id=$1", [parentId]);
await q("insert into job_posts (owner_user_id, title, status, care_type, location_label, pay_min, pay_max, schedule_label, is_co_hire) values ($1,'After-school Care · Mon–Thu','open','home_family','Brooklyn, NY',22,28,'Mon–Thu, 3–6pm',true)", [parentId]);
await q("insert into job_posts (owner_user_id, title, status, care_type) values ($1,'Weekend Nanny Share','open','home_family'),($1,'Summer Helper · Full-time','draft','home_family'),($1,'Newborn Night Support','open','home_family')", [parentId]);

async function caregiver(email, first, last, nick, zip, headline, about, level, rate, ages, settings, avatar) {
  const id = await mkUser(email);
  await q("update profiles set role='caregiver', first_name=$2, last_name=$3, preferred_name=$4, zip_code=$5, avatar_url=$6, registered_at=now(), onboarding_completed_at=now() where id=$1", [id, first, last, nick, zip, avatar]);
  await q("insert into caregiver_profiles (user_id, headline, about, experience_level, rate_amount, rate_unit, looking_for_paid_work, intents, is_published) values ($1,$2,$3,$4,$5,'hour',true,'{paid_work}',true) on conflict (user_id) do update set is_published=true, headline=excluded.headline", [id, headline, about, level, rate]);
  for (const a of ages) await q("insert into caregiver_age_groups (user_id, age) values ($1,$2) on conflict do nothing", [id, a]);
  for (const s of settings) await q("insert into caregiver_care_settings (user_id, setting) values ($1,$2) on conflict do nothing", [id, s]);
  const skills = (await q("select id from skills limit 3")).rows.map((r) => r.id);
  for (const s of skills) await q("insert into caregiver_skill_selections (user_id, skill_id) values ($1,$2) on conflict do nothing", [id, s]);
  await q("insert into caregiver_reviews (caregiver_user_id, rating, body, is_published, status) values ($1,5,'Wonderful with our kids!',true,'published'),($1,4,'Reliable and warm',true,'published')", [id]);
  await q("insert into verifications (user_id, type, status) values ($1,'identity','verified')", [id]);
  return id;
}
await caregiver("mkt-demo-maya@raisingclub-test.dev","Maya","Hernandez","Maya","Brooklyn, NY","Patient & creative caregiver","I turn everyday moments into learning adventures. 8 years with infants and toddlers.","5_10_years",28,["infant","toddler"],["one_child_family","nanny_share"],"https://i.pravatar.cc/300?img=47");
await caregiver("mkt-demo-aiko@raisingclub-test.dev","Aiko","Tanaka","Aiko","San Francisco, CA","Montessori-inspired educator","Former preschool director with a gentle, Montessori-inspired approach.","10_plus_years",42,["preschool","school_age"],["group_center","tutoring_enrichment"],"https://i.pravatar.cc/300?img=32");
await caregiver("mkt-demo-camille@raisingclub-test.dev","Camille","Dubois","Camille","Austin, TX","Bilingual caregiver","Bilingual caregiver bringing warmth, structure and lots of laughter to every family.","3_5_years",24,["toddler","preschool"],["multi_children_family"],"https://i.pravatar.cc/300?img=45");

console.log("Demo ready (pw:", pw + ")");
console.log("  parent   :", parentEmail, "(4 jobs: 3 open, 1 draft)");
console.log("  caregivers: Maya, Aiko, Camille (published)");
await c.end();
