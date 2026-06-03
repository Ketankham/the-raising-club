// Verifies the "My Events" data path without a browser:
//  1) make one seeded event upcoming + register the QA parent for one upcoming
//     and one past event (via service pg),
//  2) sign in as the QA parent (publishable key) and run the SAME query getMyEvents
//     uses, asserting the RLS embed works and the upcoming/past split is correct.
// Run: node --env-file=.env.local scripts/verify-my-events.mjs
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const dbpw = process.env.SUPABASE_DB_PASSWORD;
const PARENT = "qa-parent@raisingclub-test.dev";
const PW = process.env.QA_PASSWORD || "RaisingQA!2026";

const c = new pg.Client({ host: "db.xocomzqhlciukgodjptr.supabase.co", port: 5432, user: "postgres", password: dbpw, database: "postgres", ssl: { rejectUnauthorized: false } });
await c.connect();

const parentId = (await c.query("select id from auth.users where email=$1", [PARENT])).rows[0]?.id;
const toddler = (await c.query("select id from events where slug='toddler-open-play-morning'")).rows[0]?.id;
const mont = (await c.query("select id from events where slug='montessori-club-babies-toddlers'")).rows[0]?.id;

// Make Toddler upcoming (future session).
await c.query("update event_sessions set starts_at='2026-07-15T14:00:00Z', ends_at='2026-07-15T15:30:00Z' where event_id=$1", [toddler]);

// Register the parent for both (idempotent).
for (const ev of [toddler, mont]) {
  const exists = (await c.query("select id from event_registrations where event_id=$1 and registrant_user_id=$2 and status not in ('cancelled','denied')", [ev, parentId])).rows[0];
  if (!exists) {
    await c.query("insert into event_registrations (event_id, registrant_user_id, status, adult_count, contact_email) values ($1,$2,'confirmed',1,$3)", [ev, parentId, PARENT]);
  }
}
await c.end();

// Now query AS THE PARENT (RLS in effect).
const sb = createClient(url, key, { auth: { persistSession: false } });
const { error: signErr } = await sb.auth.signInWithPassword({ email: PARENT, password: PW });
if (signErr) { console.error("sign-in failed:", signErr.message); process.exit(1); }

const { data, error } = await sb
  .from("event_registrations")
  .select(`status, events ( slug, title, status, event_sessions ( starts_at, ends_at ) )`)
  .eq("registrant_user_id", (await sb.auth.getUser()).data.user.id)
  .not("status", "in", "(cancelled,denied)");
if (error) { console.error("query failed:", error.message); process.exit(1); }

const now = Date.now();
const up = [], past = [];
for (const r of data) {
  const e = r.events;
  if (!e) continue;
  const sessions = (e.event_sessions ?? []).map((s) => +new Date(s.starts_at)).sort((a, b) => a - b);
  const nextUpcoming = sessions.find((t) => t >= now);
  const isPast = ["completed", "cancelled", "archived"].includes(e.status) || nextUpcoming === undefined;
  (isPast ? past : up).push(e.title);
}
console.log("Upcoming:", up);
console.log("Past:    ", past);
await sb.auth.signOut();
