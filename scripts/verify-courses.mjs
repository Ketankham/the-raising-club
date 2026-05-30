// Verifies the courses schema (0019 + 0020) landed on the live DB.
import pg from "pg";

const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) {
  console.error("Set SUPABASE_DB_PASSWORD");
  process.exit(1);
}

const client = new pg.Client({
  host: "db.xocomzqhlciukgodjptr.supabase.co",
  port: 5432,
  user: "postgres",
  password,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const courseTables = [
  "course_categories", "course_approaches", "courses", "course_chapters",
  "course_modules", "course_module_resources", "course_revision_questions",
  "course_revision_options", "course_quizzes", "course_quiz_questions",
  "course_quiz_options", "course_skills", "course_certificate_config",
  "course_bundles", "course_bundle_items", "course_enrollments",
  "course_module_progress", "course_revision_answers", "course_quiz_attempts",
  "certificates",
];

const { rows: tbls } = await client.query(
  `select c.relname, c.relrowsecurity
     from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = any($1) and c.relkind = 'r'
    order by c.relname`,
  [courseTables]
);
console.log(`Tables found: ${tbls.length}/${courseTables.length}`);
const missing = courseTables.filter((t) => !tbls.find((r) => r.relname === t));
if (missing.length) console.log("  MISSING:", missing.join(", "));
const noRls = tbls.filter((r) => !r.relrowsecurity).map((r) => r.relname);
console.log(noRls.length ? `  RLS DISABLED on: ${noRls.join(", ")}` : "  RLS enabled on all ✓");

const { rows: fns } = await client.query(
  `select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and proname = any($1) order by proname`,
  [[
    "course_can_manage", "course_is_public", "course_bundle_can_manage",
    "course_bundle_is_public", "owns_course_enrollment", "course_quiz_for_taker",
    "submit_course_quiz", "course_quiz_review", "verify_certificate",
    "enforce_course_resource_cap",
  ]]
);
console.log(`Functions: ${fns.map((r) => r.proname).join(", ")}`);

const { rows: enums } = await client.query(
  `select t.typname from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname like 'course\\_%' and t.typtype = 'e'
    order by t.typname`
);
console.log(`Enums: ${enums.map((r) => r.typname).join(", ")}`);

const cats = (await client.query("select count(*) from course_categories")).rows[0].count;
const apps = (await client.query("select count(*) from course_approaches")).rows[0].count;
const sk = (await client.query("select count(*) from skills")).rows[0].count;
console.log(`Seed: categories=${cats} (expect 8), approaches=${apps} (expect 4), skills total=${sk}`);

const { rows: bucket } = await client.query(
  "select id, public from storage.buckets where id = 'course-assets'"
);
console.log(`Storage bucket course-assets: ${bucket.length ? `present (public=${bucket[0].public})` : "MISSING"}`);

const { rows: view } = await client.query(
  `select relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname='public' and relname='course_certificates_with_course' and relkind='v'`
);
console.log(`View course_certificates_with_course: ${view.length ? "present ✓" : "MISSING"}`);

await client.end();
console.log("\n✓ verify-courses done.");
