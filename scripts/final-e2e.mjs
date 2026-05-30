// Full parent onboarding simulated at the DB layer, exactly as the app's server
// actions do it, using the publishable key (so RLS is enforced). Admin pg only
// verifies + cleans up.
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const URL = "https://xocomzqhlciukgodjptr.supabase.co";
const KEY = "sb_publishable_NGbgWS4e-PNaV0uhAtjFtQ_e8zZbeGg";
const admin = new pg.Client({ host: "db.xocomzqhlciukgodjptr.supabase.co", port: 5432, user: "postgres", password: process.env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
await admin.connect();
const ok = (m) => console.log("  ✓", m);
const bad = (m, e) => { console.log("  ✗", m, "→", e?.message ?? JSON.stringify(e)); };

const c = createClient(URL, KEY);
const { data: a } = await c.auth.signInAnonymously();
const id = a.user.id;
console.log("anon user", id.slice(0, 8));

// start
let e = (await c.from("onboarding_progress").insert({ user_id: id, current_step: "role-select", flow_version: 1, status: "in_progress" })).error;
e ? bad("insert progress", e) : ok("progress row created");

// role
await c.from("profiles").update({ role: "parent" }).eq("id", id);
await c.from("onboarding_progress").update({ role: "parent", current_step: "profile", completed_steps: ["role-select", "ways-to-use"] }).eq("user_id", id);
ok("role=parent, advanced to profile");

// convert (in place) + createAccount-equivalent
const email = `trc-e2e${Date.now()}@gmail.com`;
const up = await c.auth.updateUser({ email, password: "Test12345aA!" });
up.error ? bad("convert", up.error) : ok(`converted in place (same id: ${up.data.user.id === id})`);
e = (await c.from("profiles").update({ email, first_name: "Testy", registered_at: new Date().toISOString() }).eq("id", id)).error;
e ? bad("set registered_at", e) : ok("registered_at + email set");
await c.from("onboarding_progress").update({ completed_steps: ["role-select", "ways-to-use", "profile"], current_step: "goals" }).eq("user_id", id);

// promote parent data
e = (await c.from("parent_profiles").upsert({ user_id: id, child_term: "Mama", intents: ["find_care", "events"] }, { onConflict: "user_id" })).error;
e ? bad("parent_profiles", e) : ok("parent_profiles written");
e = (await c.from("children").insert({ parent_user_id: id, pet_name: "Bean", birth_month: 6, birth_year: 2022, position: 0 })).error;
e ? bad("children insert", e) : ok("child written (month/year/pet_name only)");

// complete
const now = new Date().toISOString();
await c.from("onboarding_progress").update({ status: "completed", completed_at: now, current_step: "complete", completed_steps: ["role-select", "ways-to-use", "profile", "goals", "children", "complete"] }).eq("user_id", id);
await c.from("profiles").update({ onboarding_completed_at: now }).eq("id", id);
ok("onboarding marked complete");

// admin verification
console.log("verify (admin):");
const p = (await admin.query("select role, first_name, registered_at is not null reg, onboarding_completed_at is not null done from profiles where id=$1", [id])).rows[0];
console.log("   profiles:", JSON.stringify(p));
const pp = (await admin.query("select child_term, intents from parent_profiles where user_id=$1", [id])).rows[0];
console.log("   parent_profiles:", JSON.stringify(pp));
const kids = (await admin.query("select pet_name, birth_month, birth_year from children where parent_user_id=$1", [id])).rows;
console.log("   children:", JSON.stringify(kids));
const op = (await admin.query("select status, current_step, array_length(completed_steps,1) steps from onboarding_progress where user_id=$1", [id])).rows[0];
console.log("   onboarding_progress:", JSON.stringify(op));

(p.role === "parent" && p.reg && p.done && pp.child_term === "Mama" && kids.length === 1 && op.status === "completed")
  ? ok("FULL PARENT FLOW VERIFIED")
  : bad("verification mismatch");

// cleanup
await admin.query("delete from auth.users where id=$1", [id]);
ok("cleaned up test user (cascaded children/profile/progress)");
await admin.end();
