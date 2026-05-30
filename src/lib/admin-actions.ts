"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
