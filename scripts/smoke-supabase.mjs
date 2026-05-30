// Quick connectivity check against the live Supabase project.
// Uses the public publishable key (safe to run locally).
import { createClient } from "@supabase/supabase-js";

const URL = "https://xocomzqhlciukgodjptr.supabase.co";
const KEY = "sb_publishable_NGbgWS4e-PNaV0uhAtjFtQ_e8zZbeGg";

const supabase = createClient(URL, KEY);

console.log("1) Anonymous sign-in (must be enabled in Auth settings)…");
const { data: anon, error: anonErr } = await supabase.auth.signInAnonymously();
if (anonErr) {
  console.log("   ✗", anonErr.message, `(status ${anonErr.status ?? "?"})`);
} else {
  console.log("   ✓ anon user:", anon.user?.id, "is_anonymous:", anon.user?.is_anonymous);
}

console.log("2) Does the schema exist? querying public.onboarding_progress…");
const { error: tblErr } = await supabase.from("onboarding_progress").select("user_id").limit(1);
if (tblErr) {
  console.log("   ✗", tblErr.message, `(code ${tblErr.code ?? "?"})`);
} else {
  console.log("   ✓ table reachable (RLS allows/blocks as expected)");
}
