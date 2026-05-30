"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

async function myOrg() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, userId: null as string | null, orgId: null as string | null };
  const { data: org } = await supabase.from("organizations").select("id").eq("owner_user_id", user.id).maybeSingle();
  return { supabase, userId: user.id, orgId: org?.id ?? null };
}

export async function inviteStaff(email: string): Promise<Result<{ link: string }>> {
  const { supabase, userId, orgId } = await myOrg();
  if (!orgId) return { ok: false, error: "No organization" };
  const clean = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) return { ok: false, error: "Enter a valid email address." };

  const { data, error } = await supabase
    .from("staff_invitations")
    .insert({ org_id: orgId, email: clean, invited_by: userId })
    .select("token")
    .single();
  if (error) return { ok: false, error: error.message };

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  revalidatePath("/organization/team");
  return { ok: true, data: { link: `${base}/invite/staff/${data.token}` } };
}

export async function revokeStaffInvite(id: string): Promise<Result> {
  const { supabase, orgId } = await myOrg();
  if (!orgId) return { ok: false, error: "No organization" };
  const { error } = await supabase.from("staff_invitations").update({ status: "revoked" }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/organization/team");
  return { ok: true };
}

/** Accept an invitation as the signed-in user. Returns the org_id on success. */
export async function acceptStaffInvitation(token: string): Promise<Result<{ orgId: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in to accept this invitation." };

  const { data, error } = await supabase.rpc("accept_staff_invitation", { invite_token: token });
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "This invitation is invalid or has expired." };
  return { ok: true, data: { orgId: data as string } };
}
