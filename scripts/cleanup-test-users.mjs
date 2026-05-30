// Removes anonymous test users (no email) created in the last 30 minutes.
// Safe on a fresh project; the scheduled cleanup_abandoned_onboarding() would
// purge these after 14 days anyway.
import pg from "pg";
const admin = new pg.Client({ host: "db.xocomzqhlciukgodjptr.supabase.co", port: 5432, user: "postgres", password: process.env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
await admin.connect();
const r = await admin.query("delete from auth.users where is_anonymous = true and email is null and created_at > now() - interval '30 minutes'");
console.log("deleted anon test users:", r.rowCount);
await admin.end();
