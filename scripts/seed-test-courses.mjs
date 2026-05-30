// Seeds one published demo course (idempotent by slug) so /courses + the detail
// page have content. Safe to delete later. Run:
//   node --env-file=.env.local scripts/seed-test-courses.mjs
import pg from "pg";

const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) { console.error("Set SUPABASE_DB_PASSWORD"); process.exit(1); }
const c = new pg.Client({ host: "db.xocomzqhlciukgodjptr.supabase.co", port: 5432, user: "postgres", password, database: "postgres", ssl: { rejectUnauthorized: false } });
await c.connect();
const one = async (t, p) => (await c.query(t, p)).rows[0];

const slug = "foundations-of-infant-toddler-caregiving";
await c.query("delete from courses where slug=$1", [slug]); // reset demo

const creator = (await one("select id from profiles where role='admin' order by created_at limit 1"))?.id ?? null;
const catId = (await one("select id from course_categories where slug='emotional_social'"))?.id ?? null;
const appId = (await one("select id from course_approaches where slug='montessori'"))?.id ?? null;

const course = await one(
  `insert into courses (slug, title, subtitle, summary, description, status, category_id, approach_id,
     care_type, age_min_months, age_max_months, is_free, estimated_learning_minutes, is_featured, created_by)
   values ($1,'Foundations of Infant & Toddler Caregiving',
     'Become the calm, prepared guide your child needs',
     'Understand your role as the calm, prepared guide to your child''s environment.',
     'A warm, practical foundation in early childhood caregiving — built for real life, in short sessions you can do anytime.',
     'published',$2,$3,'home_family',0,36,true,840,true,$4)
   returning id`,
  [slug, catId, appId, creator],
);
const courseId = course.id;

// signers + skills
await c.query("insert into course_certificate_config (course_id, signer1_name, signer1_title, signer2_name, signer2_title) values ($1,'Alexandra Chen','Founder & Director of Education','Dr. Rachel Nguyen','Early Childhood Development Specialist')", [courseId]);
await c.query("insert into course_skills (course_id, skill_id, position) values ($1,'observation',0),($1,'inclusive_practice',1) on conflict do nothing", [courseId]);

// chapters + modules
const ch1 = (await one("insert into course_chapters (course_id, title, position) values ($1,'Introduction',0) returning id", [courseId])).id;
const m1 = (await one("insert into course_modules (course_id, chapter_id, title, body, est_minutes, position) values ($1,$2,'Welcome to the course','<p>A warm welcome. This is a companion space — go at your own pace.</p>',6,0) returning id", [courseId, ch1])).id;
await c.query("insert into course_modules (course_id, chapter_id, title, body, est_minutes, position) values ($1,$2,'You are the Environment','<h2>The prepared adult</h2><p>Your calm is the room. We will explore what that means in everyday moments.</p>',12,1)", [courseId, ch1]);
const rq = (await one("insert into course_revision_questions (course_id, module_id, prompt, position) values ($1,$2,'What feels most true for you right now?',0) returning id", [courseId, m1])).id;
await c.query("insert into course_revision_options (course_id, question_id, body, explanation, is_recommended, position) values ($1,$2,'I take a breath before I respond','A small pause changes everything.',true,0),($1,$2,'I notice the spill, not the child','We are practising noticing.',false,1)", [courseId, rq]);

const ch2 = (await one("insert into course_chapters (course_id, title, position) values ($1,'Mirror Neurons and Emotional Contagion',1) returning id", [courseId])).id;
await c.query("insert into course_modules (course_id, chapter_id, title, body, est_minutes, position) values ($1,$2,'Regulating the Self','<p>Co-regulation begins with you.</p>',18,0)", [courseId, ch2]);

// final quiz
const quiz = (await one("insert into course_quizzes (course_id, intro_copy, pass_threshold) values ($1,'A short integration moment to bring it together.',60) returning id", [courseId])).id;
const mkQ = async (prompt, right, wrong) => {
  const qid = (await one("insert into course_quiz_questions (course_id, quiz_id, prompt, position) values ($1,$2,$3,0) returning id", [courseId, quiz, prompt])).id;
  await c.query("insert into course_quiz_options (course_id, question_id, body, explanation, is_correct, position) values ($1,$2,$3,'Yes — this reflects a prepared, calm response.',true,0),($1,$2,$4,'Not quite — revisit the module on co-regulation.',false,1)", [courseId, qid, right, wrong]);
};
await mkQ("When your toddler melts down, the most helpful first move is to…", "Steady your own breath and lower your voice", "Quickly fix the problem so it stops");
await mkQ("“You are the environment” means…", "Your calm shapes the room your child experiences", "The room’s decor matters most");

console.log("Seeded demo course:", slug, courseId);
await c.end();
