// Job creation loop under REAL RLS, mirroring createJob/updateJob/setJobStatus +
// the applicant flow. Verifies INSERT … RETURNING works for the owner's draft
// (0022 guardrail), publish trigger stamps published_at, skills write, and the
// caregiver-applies → manager-reads → status-update path. Self-cleans.
//   node --env-file=.env.local scripts/smoke-job-creation.mjs
import pg from "pg";
import crypto from "node:crypto";
const c = new pg.Client({ host: "db.xocomzqhlciukgodjptr.supabase.co", port: 5432, user: "postgres", password: process.env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
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
const asUser = (id) => q("select set_config('request.jwt.claims', json_build_object('sub',$1::text,'role','authenticated')::text, true)", [id]);
const s = Date.now();
let parentId, cgId;
try {
  parentId = await mkUser(`job.parent.${s}@raisingclub-test.dev`);
  cgId = await mkUser(`job.cg.${s}@raisingclub-test.dev`);
  await q("update profiles set role='parent', preferred_name='Poster', registered_at=now(), onboarding_completed_at=now() where id=$1", [parentId]);
  await q("update profiles set role='caregiver', first_name='Cara', last_name='Vega', preferred_name='Cara', registered_at=now(), onboarding_completed_at=now() where id=$1", [cgId]);
  await q("insert into caregiver_profiles (user_id, headline, is_published) values ($1,'Gentle nanny',true) on conflict (user_id) do update set is_published=true", [cgId]);
  const skill = (await one("select id from skills limit 1")).id;

  // ---- PARENT creates a job (RLS) ----------------------------------------
  await q("begin"); await q("set local role authenticated"); await asUser(parentId);
  // createJob: insert ... returning id  (THE 0022 guardrail test for job_posts)
  const draft = await one("insert into job_posts (owner_user_id, title, status, care_type, ages, schedule, pay_min, pay_max) values ($1,'Morning Toddler Care','draft','home_family','{toddler}','{mornings,weekdays}',20,25) returning id", [parentId]);
  assert(!!draft?.id, "parent: INSERT … RETURNING a draft job (0022 guardrail holds)");
  await q("insert into job_skills (job_post_id, skill_id) values ($1,$2)", [draft.id, skill]);
  const sk = Number((await one("select count(*) n from job_skills where job_post_id=$1", [draft.id])).n);
  assert(sk === 1, "parent: desired skill written");

  // publish (setJobStatus open) → trigger stamps published_at
  await q("update job_posts set status='open' where id=$1", [draft.id]);
  const pub = await one("select status, published_at from job_posts where id=$1", [draft.id]);
  assert(pub.status === "open" && pub.published_at != null, "parent: publish stamps published_at (trigger)");

  // listMyJobs sees it
  const mine = (await q("select id from job_posts where owner_user_id=$1", [parentId])).rows.length;
  assert(mine === 1, "parent: job appears in My Care Posts");
  await q("commit");

  // ---- CAREGIVER applies (RLS) -------------------------------------------
  await q("begin"); await q("set local role authenticated"); await asUser(cgId);
  const visible = (await q("select id from job_posts where status='open'")).rows.some((r) => r.id === draft.id);
  assert(visible, "caregiver: sees the open job in Find Jobs");
  await q("insert into job_applications (job_post_id, caregiver_user_id, cover_note, proposed_rate, status) values ($1,$2,'I would love to help mornings!',24,'applied')", [draft.id, cgId]);
  const myApp = (await q("select id from job_applications where caregiver_user_id=$1", [cgId])).rows.length;
  assert(myApp === 1, "caregiver: application recorded (My Applications)");
  await q("commit");

  // ---- PARENT reviews applicant (RLS) ------------------------------------
  await q("begin"); await q("set local role authenticated"); await asUser(parentId);
  const app = await one("select id, cover_note from job_applications where job_post_id=$1", [draft.id]);
  assert(!!app && /mornings/.test(app.cover_note), "parent: reads applicant (japps_manager_read)");
  const pubcg = await one("select public_caregiver($1) j", [cgId]);
  assert(pubcg.j && pubcg.j.firstName === "Cara", "parent: applicant identity via public_caregiver()");
  await q("update job_applications set status='shortlisted' where id=$1", [app.id]);
  const st = (await one("select status from job_applications where id=$1", [app.id])).status;
  assert(st === "shortlisted", "parent: updates application status (shortlist)");
  await q("commit");

  // cleanup job (cascades skills/apps)
  await q("delete from job_posts where id=$1", [draft.id]);
} catch (e) {
  console.error("ERROR:", e.message); ok = false; try { await q("rollback"); } catch {}
} finally {
  for (const id of [parentId, cgId]) if (id) await q("delete from auth.users where id=$1", [id]);
  await c.end();
  console.log(ok ? "\n✓ job creation flow PASSED" : "\n✗ FAILURES above");
  process.exit(ok ? 0 : 1);
}
