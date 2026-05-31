// End-to-end marketplace flow under REAL RLS (simulates each user's JWT +
// `authenticated` role so policies apply). Covers the Find Caregivers + co-hire
// loop exactly as the server actions/queries do it:
//   browse caregivers (RPC) → list own jobs → send co-hire invite (idempotent)
//   → caregiver reads the invite → stranger is blocked → caregiver sees open job.
// Cleans up after itself.  node --env-file=.env.local scripts/smoke-marketplace.mjs
import pg from "pg";
import crypto from "node:crypto";

const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) { console.error("Set SUPABASE_DB_PASSWORD"); process.exit(1); }
const c = new pg.Client({ host: "db.xocomzqhlciukgodjptr.supabase.co", port: 5432, user: "postgres", password, database: "postgres", ssl: { rejectUnauthorized: false } });
await c.connect();
const q = (t, p) => c.query(t, p);
const one = async (t, p) => (await q(t, p)).rows[0];
let ok = true;
const assert = (cond, label) => { console.log(`${cond ? "✓" : "✗"} ${label}`); if (!cond) ok = false; };

async function mkUser(email) {
  const id = crypto.randomUUID();
  await q(`insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, reauthentication_token, is_sso_user, is_anonymous) values ($1,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',$2, crypt('Smoke#2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{}','','','','','','', false, false)`, [id, email]);
  return id;
}
const asUser = async (id) => {
  await q("select set_config('request.jwt.claims', json_build_object('sub',$1::text,'role','authenticated')::text, true)", [id]);
};

const stamp = Date.now();
let parentId, caregiverId, strangerId;
try {
  // ---- setup as postgres (bypass RLS) ------------------------------------
  parentId = await mkUser(`mkt.parent.${stamp}@raisingclub-test.dev`);
  caregiverId = await mkUser(`mkt.caregiver.${stamp}@raisingclub-test.dev`);
  strangerId = await mkUser(`mkt.stranger.${stamp}@raisingclub-test.dev`);

  await q("update profiles set role='parent', first_name='Pat', last_name='Alvarez', preferred_name='Pat', zip_code='11215', registered_at=now(), onboarding_completed_at=now() where id=$1", [parentId]);
  await q("update profiles set role='caregiver', first_name='Maya', last_name='Hernandez', preferred_name='Maya', zip_code='Brooklyn, NY', avatar_url='https://example.com/m.jpg', registered_at=now(), onboarding_completed_at=now() where id=$1", [caregiverId]);
  await q("update profiles set role='caregiver', first_name='Stray', registered_at=now(), onboarding_completed_at=now() where id=$1", [strangerId]);

  // rich published caregiver
  await q("insert into caregiver_profiles (user_id, headline, about, experience_level, rate_amount, rate_unit, looking_for_paid_work, intents, is_published) values ($1,'Patient & creative caregiver','I turn everyday moments into learning adventures.','5_10_years',28,'hour',true,'{paid_work}',true) on conflict (user_id) do update set is_published=true", [caregiverId]);
  await q("insert into caregiver_age_groups (user_id, age) values ($1,'infant'),($1,'toddler') on conflict do nothing", [caregiverId]);
  await q("insert into caregiver_care_settings (user_id, setting) values ($1,'one_child_family') on conflict do nothing", [caregiverId]);
  const skillIds = (await q("select id from skills limit 3")).rows.map((r) => r.id);
  for (const s of skillIds) await q("insert into caregiver_skill_selections (user_id, skill_id) values ($1,$2) on conflict do nothing", [caregiverId, s]);
  await q("insert into caregiver_reviews (caregiver_user_id, rating, body, is_published, status) values ($1,5,'Wonderful!',true,'published'),($1,4,'Great',true,'published')", [caregiverId]);
  await q("insert into verifications (user_id, type, status) values ($1,'identity','verified')", [caregiverId]);

  // parent's jobs: one open, one draft
  const openJob = (await one("insert into job_posts (owner_user_id, title, status, care_type, location_label, pay_min, pay_max, schedule_label, is_co_hire) values ($1,'After-school Care · Mon–Thu','open','home_family','Brooklyn, NY',22,28,'Mon–Thu, 3–6pm',true) returning id", [parentId])).id;
  const draftJob = (await one("insert into job_posts (owner_user_id, title, status) values ($1,'Weekend Nanny Share','draft') returning id", [parentId])).id;

  // ---- act as PARENT (RLS) -----------------------------------------------
  await q("begin"); await q("set local role authenticated"); await asUser(parentId);

  const cards = (await q("select marketplace_caregiver_cards() as j")).rows.map((r) => r.j);
  const mine = cards.find((c) => c.userId === caregiverId);
  assert(!!mine, "parent: caregiver appears in browse grid (RPC)");
  assert(mine && Number(mine.ratingAvg) === 4.5 && Number(mine.ratingCount) === 2, "parent: rating aggregates (4.5 ×2)");
  assert(mine && mine.idVerified === true, "parent: verified badge surfaces");
  assert(mine && Number(mine.rateAmount) === 28 && (mine.skills?.length ?? 0) === 3, "parent: rate + skills surface");

  const opts = (await q("select id, status from job_posts where owner_user_id=$1 and status in ('draft','open') order by created_at desc", [parentId])).rows;
  assert(opts.length === 2, "parent: own jobs list for modal (open + draft)");

  // send co-hire invite to the OPEN job (mirrors sendCoHireInvite upsert)
  await q("insert into job_invitations (job_post_id, caregiver_user_id, invited_by, message, status) values ($1,$2,$3,'We loved your profile!','pending') on conflict (job_post_id, caregiver_user_id) do update set message=excluded.message", [openJob, caregiverId, parentId]);
  // idempotent re-invite
  await q("insert into job_invitations (job_post_id, caregiver_user_id, invited_by, message, status) values ($1,$2,$3,'We loved your profile!','pending') on conflict (job_post_id, caregiver_user_id) do update set message=excluded.message", [openJob, caregiverId, parentId]);
  const invCount = Number((await one("select count(*) n from job_invitations where job_post_id=$1", [openJob])).n);
  assert(invCount === 1, "parent: co-hire invite is idempotent (1 row after re-send)");
  await q("commit");

  // ---- act as CAREGIVER (RLS) --------------------------------------------
  await q("begin"); await q("set local role authenticated"); await asUser(caregiverId);
  const myInv = (await q("select i.id, j.title from job_invitations i join job_posts j on j.id=i.job_post_id where i.caregiver_user_id=$1", [caregiverId])).rows;
  assert(myInv.length === 1 && /After-school/.test(myInv[0].title), "caregiver: can read their invite + linked job (job_posts_read via invite)");
  // accept it
  await q("update job_invitations set status='accepted', responded_at=now() where id=$1", [myInv[0].id]);
  const accepted = (await one("select status from job_invitations where id=$1", [myInv[0].id])).status;
  assert(accepted === "accepted", "caregiver: can accept the invitation");
  // open jobs visible to any authed caregiver; drafts not
  const openVisible = (await q("select id, status from job_posts where status='open'")).rows.some((r) => r.id === openJob);
  const draftHidden = !(await q("select id from job_posts where id=$1", [draftJob])).rows.length;
  assert(openVisible, "caregiver: open job visible in Find Jobs");
  assert(draftHidden, "caregiver: parent's draft job is NOT visible");
  await q("commit");

  // ---- act as STRANGER (RLS) ---------------------------------------------
  await q("begin"); await q("set local role authenticated"); await asUser(strangerId);
  const strangerSees = (await q("select id from job_invitations where caregiver_user_id=$1", [caregiverId])).rows.length;
  assert(strangerSees === 0, "stranger: cannot read someone else's invitation");
  await q("commit");
} catch (e) {
  console.error("ERROR:", e.message);
  ok = false;
  try { await q("rollback"); } catch {}
} finally {
  // cleanup (as postgres)
  for (const id of [parentId, caregiverId, strangerId]) if (id) await q("delete from auth.users where id=$1", [id]);
  await c.end();
  console.log(ok ? "\n✓ marketplace flow PASSED" : "\n✗ FAILURES above");
  process.exit(ok ? 0 : 1);
}
