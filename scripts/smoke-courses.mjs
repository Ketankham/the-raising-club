// End-to-end smoke test for the courses schema + grading function (0019/0020).
// Inserts a full course tree, enrolls a synthetic caregiver, simulates their JWT
// and calls submit_course_quiz (fail then pass), asserts certificate issuance +
// skill award + verify, then cleans everything up. Run:
//   node --env-file=.env.local scripts/smoke-courses.mjs
import pg from "pg";
import crypto from "node:crypto";

const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) { console.error("Set SUPABASE_DB_PASSWORD"); process.exit(1); }
const c = new pg.Client({ host: "db.xocomzqhlciukgodjptr.supabase.co", port: 5432, user: "postgres", password, database: "postgres", ssl: { rejectUnauthorized: false } });
await c.connect();

const q = (text, params) => c.query(text, params);
const one = async (text, params) => (await q(text, params)).rows[0];
let ok = true;
const assert = (cond, label) => { console.log(`${cond ? "✓" : "✗"} ${label}`); if (!cond) ok = false; };

const email = `smoke.courses.${Date.now()}@raisingclub-test.dev`;
let userId, courseId;
try {
  // --- synthetic caregiver learner ----------------------------------------
  userId = crypto.randomUUID();
  await q(
    `insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
       created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
       confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, reauthentication_token,
       is_sso_user, is_anonymous)
     values ($1,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',$2,
       crypt('Smoke#2026', gen_salt('bf')), now(), now(), now(),
       '{"provider":"email","providers":["email"]}','{}','','','','','','', false, false)`,
    [userId, email],
  );
  await q("update profiles set role='caregiver', first_name='Smoke', last_name='Tester', preferred_name='Smoke Tester', registered_at=now() where id=$1", [userId]);
  await q("insert into caregiver_profiles (user_id) values ($1) on conflict do nothing", [userId]);

  // --- course tree ---------------------------------------------------------
  courseId = (await one(
    "insert into courses (slug, title, status, mode, estimated_learning_minutes, created_by) values ($1,'Smoke Course','published','Online · Self-paced',120,$2) returning id",
    [`smoke-${Date.now()}`, userId],
  )).id;
  const chapterId = (await one("insert into course_chapters (course_id, title, position) values ($1,'Chapter 1',0) returning id", [courseId])).id;
  const moduleId = (await one("insert into course_modules (course_id, chapter_id, title, body, position) values ($1,$2,'Module 1','<p>Hello</p>',0) returning id", [courseId, chapterId])).id;
  await q("insert into course_module_resources (course_id, module_id, label, kind, url, position) values ($1,$2,'Guide','gdoc','https://example.com/guide',0)", [courseId, moduleId]);
  const revQ = (await one("insert into course_revision_questions (course_id, module_id, prompt, position) values ($1,$2,'What feels true?',0) returning id", [courseId, moduleId])).id;
  await q("insert into course_revision_options (course_id, question_id, body, explanation, is_recommended, position) values ($1,$2,'A','because',true,0),($1,$2,'B','also',false,1)", [courseId, revQ]);

  await q("insert into course_certificate_config (course_id, signer1_name, signer1_title) values ($1,'Alexandra Chen','Founder & Director of Education')", [courseId]);
  await q("insert into course_skills (course_id, skill_id, position) values ($1,'first_aid',0),($1,'observation',1)", [courseId]);

  // quiz: 2 questions, one correct option each
  const quizId = (await one("insert into course_quizzes (course_id, pass_threshold) values ($1,60) returning id", [courseId])).id;
  const mk = async (prompt, correctBody) => {
    const qid = (await one("insert into course_quiz_questions (course_id, quiz_id, prompt, position) values ($1,$2,$3,0) returning id", [courseId, quizId, prompt])).id;
    const correct = (await one("insert into course_quiz_options (course_id, question_id, body, is_correct, position) values ($1,$2,$3,true,0) returning id", [courseId, qid, correctBody])).id;
    const wrong = (await one("insert into course_quiz_options (course_id, question_id, body, is_correct, position) values ($1,$2,'Nope',false,1) returning id", [courseId, qid])).id;
    return { qid, correct, wrong };
  };
  const q1 = await mk("Q1?", "Right1");
  const q2 = await mk("Q2?", "Right2");

  // --- read-back (mirrors getCourseForEdit nested select) ------------------
  const back = await one(
    `select c.title,
       (select count(*) from course_chapters where course_id=c.id) chapters,
       (select count(*) from course_modules where course_id=c.id) modules,
       (select count(*) from course_module_resources where course_id=c.id) resources,
       (select count(*) from course_quiz_questions where course_id=c.id) qq
     from courses c where c.id=$1`, [courseId]);
  assert(Number(back.chapters) === 1 && Number(back.modules) === 1 && Number(back.resources) === 1 && Number(back.qq) === 2, "course tree inserted + reads back");

  // --- enroll --------------------------------------------------------------
  await q("insert into course_enrollments (user_id, course_id) values ($1,$2)", [userId, courseId]);

  // --- simulate the learner's JWT + grade ----------------------------------
  await q("begin");
  await q("select set_config('request.jwt.claims', json_build_object('sub',$1::text,'role','authenticated')::text, true)", [userId]);

  // taker view must NOT leak is_correct
  const takerView = (await one("select course_quiz_for_taker($1) v", [courseId])).v;
  const takerJson = JSON.stringify(takerView);
  assert(!takerJson.includes("is_correct"), "course_quiz_for_taker hides is_correct");

  // failing attempt (both wrong)
  const failAns = JSON.stringify({ [q1.qid]: q1.wrong, [q2.qid]: q2.wrong });
  const failRes = (await one("select submit_course_quiz($1,$2::jsonb) v", [courseId, failAns])).v;
  assert(failRes.passed === false && failRes.score === 0, `failing attempt scored ${failRes.score}, passed=${failRes.passed}`);

  // passing attempt (both correct)
  const passAns = JSON.stringify({ [q1.qid]: q1.correct, [q2.qid]: q2.correct });
  const passRes = (await one("select submit_course_quiz($1,$2::jsonb) v", [courseId, passAns])).v;
  assert(passRes.passed === true && passRes.score === 100, `passing attempt scored ${passRes.score}, passed=${passRes.passed}`);
  assert(!!passRes.certificate_id && /^TRC-\d{8}-/.test(passRes.certificate_id), `certificate id ${passRes.certificate_id}`);

  // review reveals correctness after pass
  const review = (await one("select course_quiz_review($1) v", [courseId])).v;
  assert(JSON.stringify(review).includes("is_correct"), "course_quiz_review reveals answers after passing");

  // verify by token (public)
  const ver = (await one("select verify_certificate($1) v", [passRes.verify_token])).v;
  assert(ver.valid === true && ver.course_title === "Smoke Course" && ver.recipient_name === "Smoke Tester", "verify_certificate returns valid + snapshot");

  await q("commit");

  // --- assert side effects persisted --------------------------------------
  const enr = await one("select status, completed_at from course_enrollments where user_id=$1 and course_id=$2", [userId, courseId]);
  assert(enr.status === "completed" && enr.completed_at, "enrollment marked completed");
  const attempts = Number((await one("select count(*) n from course_quiz_attempts where enrollment_id in (select id from course_enrollments where user_id=$1)", [userId])).n);
  assert(attempts === 2, `two attempts recorded (got ${attempts})`);
  const skills = (await q("select skill_id, proof from caregiver_skill_selections where user_id=$1 order by skill_id", [userId])).rows;
  assert(skills.length === 2 && skills.every((s) => s.proof === "trc_course"), `2 skills awarded with proof=trc_course (got ${skills.map((s) => s.skill_id).join(",")})`);
  const certs = Number((await one("select count(*) n from certificates where user_id=$1", [userId])).n);
  assert(certs === 1, "exactly one certificate (idempotent)");
} catch (e) {
  console.error("ERROR:", e.message);
  ok = false;
  try { await q("rollback"); } catch {}
} finally {
  // cleanup: course cascade removes content/enrollment/cert/attempts; user cascade removes profile + skills.
  if (courseId) await q("delete from courses where id=$1", [courseId]).catch(() => {});
  if (userId) await q("delete from auth.users where id=$1", [userId]).catch(() => {});
  await c.end();
  console.log(ok ? "\n✓ smoke-courses PASSED (cleaned up)" : "\n✗ smoke-courses FAILED");
  process.exit(ok ? 0 : 1);
}
