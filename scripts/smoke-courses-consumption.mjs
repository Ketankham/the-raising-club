// Smoke test for the learner consumption path under REAL RLS: enroll, module
// progress, revision answer, quiz submit, then the public credential function.
// Simulates the learner's JWT + `authenticated` role so RLS policies apply.
//   node --env-file=.env.local scripts/smoke-courses-consumption.mjs
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

const email = `smoke.consume.${Date.now()}@raisingclub-test.dev`;
let userId, courseId;
try {
  // setup as postgres (bypass RLS)
  userId = crypto.randomUUID();
  await q(`insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, reauthentication_token, is_sso_user, is_anonymous) values ($1,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',$2, crypt('Smoke#2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{}','','','','','','', false, false)`, [userId, email]);
  await q("update profiles set role='caregiver', preferred_name='Consume Tester', registered_at=now() where id=$1", [userId]);
  await q("insert into caregiver_profiles (user_id, is_published) values ($1,true) on conflict (user_id) do update set is_published=true", [userId]);

  courseId = (await one("insert into courses (slug, title, status, created_by) values ($1,'Consume Course','published',$2) returning id", [`consume-${Date.now()}`, userId])).id;
  const ch = (await one("insert into course_chapters (course_id,title,position) values ($1,'Ch',0) returning id", [courseId])).id;
  const m1 = (await one("insert into course_modules (course_id,chapter_id,title,position) values ($1,$2,'M1',0) returning id", [courseId, ch])).id;
  const m2 = (await one("insert into course_modules (course_id,chapter_id,title,position) values ($1,$2,'M2',1) returning id", [courseId, ch])).id;
  const rq = (await one("insert into course_revision_questions (course_id,module_id,prompt,position) values ($1,$2,'?',0) returning id", [courseId, m1])).id;
  const opt = (await one("insert into course_revision_options (course_id,question_id,body,position) values ($1,$2,'A',0) returning id", [courseId, rq])).id;
  await q("insert into course_certificate_config (course_id, signer1_name) values ($1,'Alexandra Chen')", [courseId]);
  await q("insert into course_skills (course_id, skill_id) values ($1,'observation')", [courseId]);
  const quiz = (await one("insert into course_quizzes (course_id) values ($1) returning id", [courseId])).id;
  const qq = (await one("insert into course_quiz_questions (course_id,quiz_id,prompt,position) values ($1,$2,'Q',0) returning id", [courseId, quiz])).id;
  const right = (await one("insert into course_quiz_options (course_id,question_id,body,is_correct,position) values ($1,$2,'right',true,0) returning id", [courseId, qq])).id;
  await q("insert into course_quiz_options (course_id,question_id,body,is_correct,position) values ($1,$2,'wrong',false,1)", [courseId, qq]);

  // --- act as the learner (RLS enforced) ---------------------------------
  await q("begin");
  await q("set local role authenticated");
  await q("select set_config('request.jwt.claims', json_build_object('sub',$1::text,'role','authenticated')::text, true)", [userId]);

  await q("insert into course_enrollments (user_id, course_id) values ($1,$2)", [userId, courseId]);
  const enr = (await one("select id from course_enrollments where user_id=$1 and course_id=$2", [userId, courseId]));
  assert(!!enr, "RLS: learner can enroll + read own enrollment");

  await q("insert into course_module_progress (enrollment_id, module_id) values ($1,$2),($1,$3)", [enr.id, m1, m2]);
  const prog = Number((await one("select count(*) n from course_module_progress where enrollment_id=$1", [enr.id])).n);
  assert(prog === 2, "RLS: learner records module progress");

  await q("insert into course_revision_answers (enrollment_id, question_id, chosen_option_id) values ($1,$2,$3)", [enr.id, rq, opt]);
  // re-answer is a no-op (the action upserts with on-conflict-do-nothing) — solved once.
  await q("insert into course_revision_answers (enrollment_id, question_id, chosen_option_id) values ($1,$2,$3) on conflict (enrollment_id, question_id) do nothing", [enr.id, rq, opt]);
  const ansCount = Number((await one("select count(*) n from course_revision_answers where enrollment_id=$1", [enr.id])).n);
  assert(ansCount === 1, "revision answer is solved-once (re-answer ignored)");

  const res = (await one("select submit_course_quiz($1,$2::jsonb) v", [courseId, JSON.stringify({ [qq]: right })])).v;
  assert(res.passed === true, "submit_course_quiz passes under learner context");
  await q("commit");

  // --- public credential function (anon) ---------------------------------
  await q("begin");
  await q("set local role anon");
  const direct = Number((await one("select count(*) n from certificates where user_id=$1", [userId])).n);
  assert(direct === 0, "RLS: anon cannot read certificates table directly");
  const pubCerts = (await q("select * from public_caregiver_certificates($1)", [userId])).rows;
  assert(pubCerts.length === 1 && pubCerts[0].course_title === "Consume Course", "public_caregiver_certificates exposes published cert to anon");
  // earned skill is publicly readable for a published caregiver
  const pubSkills = (await q("select skill_id, proof from caregiver_skill_selections where user_id=$1", [userId])).rows;
  assert(pubSkills.length === 1 && pubSkills[0].proof === "trc_course", "earned skill (trc_course) publicly readable for published caregiver");
  await q("commit");
} catch (e) {
  console.error("ERROR:", e.message);
  ok = false;
  try { await q("rollback"); } catch {}
} finally {
  await q("reset role").catch(() => {});
  if (courseId) await q("delete from courses where id=$1", [courseId]).catch(() => {});
  if (userId) await q("delete from auth.users where id=$1", [userId]).catch(() => {});
  await c.end();
  console.log(ok ? "\n✓ smoke-courses-consumption PASSED (cleaned up)" : "\n✗ FAILED");
  process.exit(ok ? 0 : 1);
}
