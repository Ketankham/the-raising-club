// Purge anonymous auth users (and their cascaded rows: profiles, registrations,
// registration-children, contacts, waiver acceptances, saves). Use after manual
// browser walkthroughs. Run: node --env-file=.env.local scripts/cleanup-anon-users.mjs
import pg from "pg";
const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) { console.error("Set SUPABASE_DB_PASSWORD"); process.exit(1); }
const client = new pg.Client({
  host: "db.xocomzqhlciukgodjptr.supabase.co",
  port: 5432, user: "postgres", password, database: "postgres",
  ssl: { rejectUnauthorized: false },
});
await client.connect();
const r = await client.query("delete from auth.users where is_anonymous = true");
console.log(`✓ Deleted ${r.rowCount} anonymous user(s) (cascaded).`);
await client.end();
