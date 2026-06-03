"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { plansForRole } from "@/lib/plans/queries";

type Result<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

/** Resolve the current user and confirm they are an admin. */
async function asAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, adminId: null as string | null, isAdmin: false };
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return { supabase, adminId: user.id, isAdmin: me?.role === "admin" };
}

export async function deactivateUser(userId: string): Promise<Result> {
  const { supabase, adminId, isAdmin } = await asAdmin();
  if (!isAdmin) return { ok: false, error: "Admins only" };
  if (userId === adminId) return { ok: false, error: "You can't deactivate your own account." };
  const { error } = await supabase.from("profiles").update({ deactivated_at: new Date().toISOString() }).eq("id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

export async function reactivateUser(userId: string): Promise<Result> {
  const { supabase, isAdmin } = await asAdmin();
  if (!isAdmin) return { ok: false, error: "Admins only" };
  const { error } = await supabase.from("profiles").update({ deactivated_at: null }).eq("id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

/** Admin edit of a user's name + contact fields (admin RLS allows the update). */
export async function adminUpdatePersonalDetails(
  userId: string,
  input: { firstName: string; lastName: string; preferredName: string; phone: string; zip: string },
): Promise<Result> {
  const { supabase, isAdmin } = await asAdmin();
  if (!isAdmin) return { ok: false, error: "Admins only" };
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: input.firstName.trim() || null,
      last_name: input.lastName.trim() || null,
      preferred_name: input.preferredName.trim() || null,
      phone: input.phone.trim() || null,
      zip_code: input.zip.trim() || null,
    })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin");
  return { ok: true };
}

/** Admin edit of a user's membership plan. Plan key validated against the target's role. */
export async function adminUpdatePlan(
  userId: string,
  planKey: string,
  interval: "monthly" | "annual",
): Promise<Result> {
  const { supabase, isAdmin } = await asAdmin();
  if (!isAdmin) return { ok: false, error: "Admins only" };

  const { data: target } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (!target) return { ok: false, error: "User not found" };

  const plan = (await plansForRole(target.role)).find((p) => p.key === planKey);
  if (!plan) return { ok: false, error: "That plan isn't available for this user's role" };
  if (interval !== "monthly" && interval !== "annual") return { ok: false, error: "Invalid billing interval" };

  const planValue = plan.price === "free" ? null : plan.key;
  const { error } = await supabase
    .from("profiles")
    .update({ plan_key: planValue, plan_interval: interval, plan_selected_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function revokeInvitation(id: string): Promise<Result> {
  const { supabase, isAdmin } = await asAdmin();
  if (!isAdmin) return { ok: false, error: "Admins only" };
  const { error } = await supabase.from("user_invitations").update({ status: "revoked" }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

export async function inviteUser(input: { email: string; role: string }): Promise<Result<{ link: string; emailed: boolean }>> {
  const { supabase, adminId, isAdmin } = await asAdmin();
  if (!isAdmin) return { ok: false, error: "Admins only" };
  const email = input.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "Enter a valid email address." };

  const { data, error } = await supabase
    .from("user_invitations")
    .insert({ email, role: input.role, invited_by: adminId })
    .select("token")
    .single();
  if (error) return { ok: false, error: error.message };

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const link = `${base}/onboarding?invite=${data.token}`;

  // Real email delivery requires the Supabase service role + SMTP. If the
  // service role key is present, send a proper invite; otherwise return the
  // shareable link for the admin to send manually.
  let emailed = false;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { createClient: createAdminClient } = await import("@supabase/supabase-js");
      const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey);
      const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${base}/auth/confirm`,
        data: { invited_role: input.role },
      });
      emailed = !inviteErr;
    } catch {
      emailed = false;
    }
  }

  revalidatePath("/admin");
  return { ok: true, data: { link, emailed } };
}

/** Send a password-reset email to a user (admin only). Falls back to a reset
 *  link that the admin can copy and share if email isn't configured. */
export async function adminSendPasswordReset(
  email: string,
): Promise<{ ok: true; emailed: boolean; link?: string } | { ok: false; error: string }> {
  const { isAdmin } = await asAdmin();
  if (!isAdmin) return { ok: false, error: "Admins only" };

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://theraisingclub.com";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (serviceKey && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { createClient: createAdminClient } = await import("@supabase/supabase-js");
      const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey);
      const { data, error } = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo: `${base}/auth/reset-password` },
      });
      if (!error && data?.properties?.action_link) {
        return { ok: true, emailed: false, link: data.properties.action_link };
      }
    } catch {}
  }

  // Fallback: trigger standard reset email (works if SMTP is configured)
  const { supabase } = await asAdmin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${base}/auth/reset-password`,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, emailed: true };
}
