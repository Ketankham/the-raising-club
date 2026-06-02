"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { plansForRole } from "@/lib/plans/queries";

type Result = { ok: true } | { ok: false; error: string };

async function me() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

const done = (): Result => {
  revalidatePath("/dashboard/settings");
  return { ok: true };
};

/** Name + contact fields on the shared profiles row. Empty strings clear the field. */
export async function updatePersonalDetails(input: {
  firstName: string;
  lastName: string;
  preferredName: string;
  phone: string;
  zip: string;
}): Promise<Result> {
  const { supabase, user } = await me();
  if (!user) return { ok: false, error: "Not signed in" };
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: input.firstName.trim() || null,
      last_name: input.lastName.trim() || null,
      preferred_name: input.preferredName.trim() || null,
      phone: input.phone.trim() || null,
      zip_code: input.zip.trim() || null,
    })
    .eq("id", user.id);
  return error ? { ok: false, error: error.message } : done();
}

/** Change the account email. Triggers Supabase's confirm-email flow (standard). */
export async function updateEmail(email: string): Promise<Result> {
  const { supabase, user } = await me();
  if (!user) return { ok: false, error: "Not signed in" };
  const next = encodeURIComponent("/dashboard/settings");
  const origin = (await headers()).get("origin") ?? "";
  const { error } = await supabase.auth.updateUser(
    { email: email.trim() },
    { emailRedirectTo: origin ? `${origin}/auth/confirm?next=${next}` : undefined },
  );
  return error ? { ok: false, error: error.message } : done();
}

/** Set a new password for the signed-in user. */
export async function updatePassword(newPassword: string): Promise<Result> {
  const { supabase, user } = await me();
  if (!user) return { ok: false, error: "Not signed in" };
  if (newPassword.length < 8) return { ok: false, error: "Password must be at least 8 characters" };
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return error ? { ok: false, error: error.message } : done();
}

/** Send a password-reset email (standard flow; requires SMTP to actually deliver). */
export async function sendPasswordReset(): Promise<Result> {
  const { supabase, user } = await me();
  if (!user?.email) return { ok: false, error: "No email on file" };
  const origin = (await headers()).get("origin") ?? "";
  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: origin ? `${origin}/auth/confirm?next=/dashboard/settings` : undefined,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/**
 * Record the membership plan the user selected. The plan key is re-validated
 * server-side against the user's role catalog — never trust the client.
 */
export async function updatePlan(planKey: string, interval: "monthly" | "annual"): Promise<Result> {
  const { supabase, user } = await me();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile) return { ok: false, error: "No profile" };

  const allowed = await plansForRole(profile.role);
  const plan = allowed.find((p) => p.key === planKey);
  if (!plan) return { ok: false, error: "That plan isn't available for your account" };
  if (interval !== "monthly" && interval !== "annual") return { ok: false, error: "Invalid billing interval" };

  // The free starter plan is represented as plan_key = null.
  const planValue = plan.price === "free" ? null : plan.key;

  const { error } = await supabase
    .from("profiles")
    .update({ plan_key: planValue, plan_interval: interval, plan_selected_at: new Date().toISOString() })
    .eq("id", user.id);
  return error ? { ok: false, error: error.message } : done();
}

/** Parent-only: what the child calls them + their goals. */
export async function updateParentPreferences(input: {
  childTerm: string;
  intents: string[];
}): Promise<Result> {
  const { supabase, user } = await me();
  if (!user) return { ok: false, error: "Not signed in" };
  const { error } = await supabase
    .from("parent_profiles")
    .upsert(
      { user_id: user.id, child_term: input.childTerm.trim() || null, intents: input.intents },
      { onConflict: "user_id" },
    );
  return error ? { ok: false, error: error.message } : done();
}
