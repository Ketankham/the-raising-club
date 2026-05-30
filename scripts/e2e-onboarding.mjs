// End-to-end check against the live DB.
// - publishable key  -> mimics real browser sessions (auth + RLS behaviour)
// - pg (admin)       -> verifies trigger side-effects (registered_at, profiles)
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const URL = "https://xocomzqhlciukgodjptr.supabase.co";
const KEY = "sb_publishable_NGbgWS4e-PNaV0uhAtjFtQ_e8zZbeGg";

const admin = new pg.Client({
  host: "db.xocomzqhlciukgodjptr.supabase.co",
  port: 5432,
  user: "postgres",
  password: process.env.SUPABASE_DB_PASSWORD,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});
await admin.connect();

const pass = (m) => console.log("  ✓", m);
const fail = (m, e) => { console.log("  ✗", m, "→", e?.message ?? e); };

const A = createClient(URL, KEY);
const B = createClient(URL, KEY);

console.log("1) Anonymous sessions");
const { data: a } = await A.auth.signInAnonymously();
const { data: b } = await B.auth.signInAnonymously();
const aId = a.user.id, bId = b.user.id;
pass(`two anon users: ${aId.slice(0, 8)} / ${bId.slice(0, 8)}`);

console.log("2) Signup trigger created a profiles row (anon => registered_at null)");
{
  const r = await admin.query("select role, registered_at, email_confirmed_at from profiles where id=$1", [aId]);
  r.rowCount === 1 && r.rows[0].registered_at === null ? pass("profiles row exists, registered_at null") : fail("profiles row", JSON.stringify(r.rows));
}

console.log("3) RLS: A can create + read its own onboarding_progress");
{
  const ins = await A.from("onboarding_progress").insert({ user_id: aId, current_step: "role-select", flow_version: 1, status: "in_progress" });
  ins.error ? fail("insert", ins.error) : pass("insert ok");
  const sel = await A.from("onboarding_progress").select("current_step").eq("user_id", aId);
  sel.data?.length === 1 ? pass("A reads its own row") : fail("A read", sel.error);
}

console.log("4) RLS isolation: B cannot see A's row");
{
  const sel = await B.from("onboarding_progress").select("user_id");
  (sel.data?.length ?? 0) === 0 ? pass("B sees 0 rows (isolated)") : fail("isolation breach", JSON.stringify(sel.data));
}

console.log("5) A sets role + advances");
{
  await A.from("profiles").update({ role: "parent" }).eq("id", aId);
  await A.from("onboarding_progress").update({ role: "parent", current_step: "profile" }).eq("user_id", aId);
  const r = await admin.query("select role from profiles where id=$1", [aId]);
  r.rows[0].role === "parent" ? pass("role persisted") : fail("role", r.rows[0]);
}

console.log("6) Seed taxonomy readable");
{
  const r = await A.from("skill_sections").select("id");
  (r.data?.length ?? 0) >= 14 ? pass(`skill_sections seeded (${r.data.length})`) : fail("seed", r.error ?? r.data?.length);
}

console.log("7) Anonymous -> permanent conversion sets registered_at");
{
  const email = `trc-e2e+${Date.now()}@example.com`;
  const up = await A.auth.updateUser({ email, password: "Test12345!aA" });
  if (up.error) {
    fail("updateUser", up.error);
  } else {
    // small delay for trigger
    await new Promise((r) => setTimeout(r, 500));
    const r = await admin.query("select registered_at, email, email_confirmed_at, is_anonymous from auth.users u left join profiles p on p.id=u.id where u.id=$1", [aId]).catch(() => null);
    const r2 = await admin.query("select registered_at, email from profiles where id=$1", [aId]);
    const reg = r2.rows[0]?.registered_at;
    reg ? pass(`registered_at set (${reg})`) : fail("registered_at not set", JSON.stringify(r2.rows[0]));
  }
}

console.log("8) Cleanup test rows");
{
  await admin.query("delete from auth.users where id = any($1)", [[aId, bId]]); // cascades profiles + progress
  pass("removed test users");
}

await admin.end();
console.log("\nDone.");
