"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ensureHousehold, findHousehold } from "./server";

type Result<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

async function me() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Create the caller's household if they don't have one yet (idempotent). */
export async function ensureMyHousehold(name?: string): Promise<Result<{ householdId: string }>> {
  const { supabase, user } = await me();
  if (!user) return { ok: false, error: "Not signed in" };
  const id = await ensureHousehold(supabase, user.id, name?.trim() || null);
  if (!id) return { ok: false, error: "Could not create your Raising Club." };
  revalidatePath("/dashboard/family");
  return { ok: true, data: { householdId: id } };
}

/** Rename the household (owner only — enforced by RLS). */
export async function renameHousehold(name: string): Promise<Result> {
  const { supabase, user } = await me();
  if (!user) return { ok: false, error: "Not signed in" };
  const id = await findHousehold(supabase, user.id);
  if (!id) return { ok: false, error: "No household yet." };
  const { error } = await supabase.from("households").update({ name: name.trim() || null }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/family");
  return { ok: true };
}

/**
 * Invite a family member by email. Enforces the plan's adult-seat limit before
 * creating the invitation. Returns a copy-link (SMTP isn't configured).
 */
export async function inviteFamilyMember(input: { email: string; relationLabel?: string }): Promise<Result<{ link: string }>> {
  const { supabase, user } = await me();
  if (!user) return { ok: false, error: "Not signed in" };

  const email = input.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "Enter a valid email address." };

  const householdId = await ensureHousehold(supabase, user.id, null);
  if (!householdId) return { ok: false, error: "Could not resolve your Raising Club." };

  // Seat check (limit comes from the household's active plan; default 1).
  const { data: usage } = await supabase.rpc("household_seat_usage", { target: householdId });
  const available = (usage as { available?: number } | null)?.available ?? 0;
  if (available <= 0) {
    return { ok: false, error: "All your member seats are in use. Upgrade your family plan to invite more adults." };
  }

  const { data, error } = await supabase
    .from("household_invitations")
    .insert({ household_id: householdId, email, relation_label: input.relationLabel?.trim() || null, invited_by: user.id })
    .select("token")
    .single();
  if (error) return { ok: false, error: error.message };

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  revalidatePath("/dashboard/family");
  return { ok: true, data: { link: `${base}/invite/household/${data.token}` } };
}

export async function revokeFamilyInvite(id: string): Promise<Result> {
  const { supabase, user } = await me();
  if (!user) return { ok: false, error: "Not signed in" };
  const { error } = await supabase.from("household_invitations").update({ status: "revoked" }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/family");
  return { ok: true };
}

/** Owner removes a member; recompute so the removed member loses inherited access. */
export async function removeFamilyMember(memberUserId: string): Promise<Result> {
  const { supabase, user } = await me();
  if (!user) return { ok: false, error: "Not signed in" };
  const householdId = await findHousehold(supabase, user.id);
  if (!householdId) return { ok: false, error: "No household." };
  if (memberUserId === user.id) return { ok: false, error: "You can't remove yourself as the owner." };

  const { error } = await supabase
    .from("household_members")
    .update({ status: "removed" })
    .eq("household_id", householdId)
    .eq("user_id", memberUserId);
  if (error) return { ok: false, error: error.message };

  // The removed member's entitlement snapshot must be cleared.
  await supabase.rpc("recompute_entitlement", { p_subject_type: "user", p_subject_id: memberUserId });
  revalidatePath("/dashboard/family");
  return { ok: true };
}

/** Accept a household invitation as the signed-in user. */
export async function acceptHouseholdInvitation(token: string): Promise<Result<{ householdId: string }>> {
  const { supabase, user } = await me();
  if (!user) return { ok: false, error: "Please sign in to accept this invitation." };
  const { data, error } = await supabase.rpc("accept_household_invitation", { invite_token: token });
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "This invitation is invalid, expired, or the family's seats are full." };
  return { ok: true, data: { householdId: data as string } };
}

/**
 * Condensed invited-adult onboarding: create (or upgrade) the visitor's account
 * and drop them straight into the inviting family as a `parent`. Skips the full
 * wizard (no household/children of their own to set up) — they inherit the
 * household's membership and can immediately post jobs and message families.
 */
export async function acceptHouseholdInviteWithNewAccount(input: {
  token: string;
  firstName: string;
  email: string;
  password: string;
}): Promise<Result<{ householdId: string }>> {
  const supabase = await createClient();
  if (input.password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  let {
    data: { user },
  } = await supabase.auth.getUser();

  // Bootstrap an anonymous session if the visitor is brand new, then upgrade it
  // in place (preserves auth.uid through the email/password attach).
  if (!user) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user) return { ok: false, error: error?.message ?? "Could not start a session." };
    user = data.user;
  }

  if (user.is_anonymous) {
    const { error: authError } = await supabase.auth.updateUser({
      email: input.email.trim(),
      password: input.password,
    });
    if (authError) {
      return { ok: false, error: `${authError.message} — if you already have an account, use “I already have an account”.` };
    }
  }

  const now = new Date().toISOString();
  await supabase
    .from("profiles")
    .update({
      role: "parent",
      first_name: input.firstName.trim() || null,
      email: input.email.trim(),
      registered_at: now,
      onboarding_completed_at: now,
    })
    .eq("id", user.id);

  const { data: hid, error } = await supabase.rpc("accept_household_invitation", { invite_token: input.token });
  if (error) return { ok: false, error: error.message };
  if (!hid) return { ok: false, error: "This invitation is invalid, expired, or the family's seats are full." };
  return { ok: true, data: { householdId: hid as string } };
}
