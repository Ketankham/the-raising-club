"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/guards";
import { resolveBillingSubject } from "@/lib/billing/subject";

type Result = { ok: true } | { ok: false; error: string };

const LIVE = ["active", "trialing", "comp", "past_due"];

/**
 * Comp grant: assign a plan to a user (or their household / org) with no Stripe.
 * Admin picks the window; entitlement honours it like a paid sub. Replaces any
 * existing active assignment for that subject (the one-active-per-subject index).
 */
export async function assignPlanManually(input: {
  userId: string;
  planKey: string;
  interval: "monthly" | "annual";
  startsAt: string; // ISO date
  endsAt: string; // ISO date (required for comp so it can't run forever by accident)
  notes?: string;
}): Promise<Result> {
  const { supabase, user: admin } = await requireAdmin();

  const { data: target } = await supabase.from("profiles").select("role").eq("id", input.userId).maybeSingle();
  if (!target) return { ok: false, error: "User not found" };

  const { data: plan } = await supabase.from("plans").select("id").eq("key", input.planKey).maybeSingle();
  if (!plan) return { ok: false, error: "Plan not found" };
  if (input.interval !== "monthly" && input.interval !== "annual") return { ok: false, error: "Invalid interval" };
  if (!input.startsAt || !input.endsAt) return { ok: false, error: "Start and end dates are required." };
  if (new Date(input.endsAt) <= new Date(input.startsAt)) return { ok: false, error: "End date must be after start date." };

  const subject = await resolveBillingSubject(supabase, input.userId, target.role, {
    create: true,
    householdName: "Family",
  });
  if (!subject) return { ok: false, error: "Could not resolve a billing account for this user." };

  // Retire any existing live assignment for this subject (keeps the unique index happy).
  await supabase
    .from("user_plans")
    .update({ status: "expired" })
    .eq("subject_type", subject.subjectType)
    .eq("subject_id", subject.subjectId)
    .in("status", LIVE);

  const { error } = await supabase.from("user_plans").insert({
    subject_type: subject.subjectType,
    subject_id: subject.subjectId,
    plan_id: plan.id,
    interval: input.interval,
    source: "manual",
    status: "comp",
    starts_at: new Date(input.startsAt).toISOString(),
    ends_at: new Date(input.endsAt).toISOString(),
    assigned_by: admin.id,
    notes: input.notes?.trim() || null,
  });
  if (error) return { ok: false, error: error.message };

  await supabase.rpc("recompute_entitlement", {
    p_subject_type: subject.subjectType,
    p_subject_id: subject.subjectId,
  });
  revalidatePath(`/admin/users/${input.userId}`);
  return { ok: true };
}

/** Cancel a manual grant immediately and refresh the subject's entitlement. */
export async function revokeUserPlan(userPlanId: string, userIdForRevalidate?: string): Promise<Result> {
  const { supabase } = await requireAdmin();
  const { data: row } = await supabase
    .from("user_plans")
    .select("subject_type, subject_id, source")
    .eq("id", userPlanId)
    .maybeSingle();
  if (!row) return { ok: false, error: "Assignment not found" };

  const { error } = await supabase
    .from("user_plans")
    .update({ status: "canceled", ends_at: new Date().toISOString() })
    .eq("id", userPlanId);
  if (error) return { ok: false, error: error.message };

  await supabase.rpc("recompute_entitlement", {
    p_subject_type: row.subject_type,
    p_subject_id: row.subject_id,
  });
  if (userIdForRevalidate) revalidatePath(`/admin/users/${userIdForRevalidate}`);
  return { ok: true };
}

/** Extend (or shorten) a manual grant's end date. */
export async function extendUserPlan(userPlanId: string, endsAt: string, userIdForRevalidate?: string): Promise<Result> {
  const { supabase } = await requireAdmin();
  const { data: row } = await supabase
    .from("user_plans")
    .select("subject_type, subject_id, status")
    .eq("id", userPlanId)
    .maybeSingle();
  if (!row) return { ok: false, error: "Assignment not found" };

  const patch: Record<string, unknown> = { ends_at: new Date(endsAt).toISOString() };
  // Re-activate if it had lapsed and the new end is in the future.
  if (row.status === "expired" && new Date(endsAt) > new Date()) patch.status = "comp";

  const { error } = await supabase.from("user_plans").update(patch).eq("id", userPlanId);
  if (error) return { ok: false, error: error.message };

  await supabase.rpc("recompute_entitlement", {
    p_subject_type: row.subject_type,
    p_subject_id: row.subject_id,
  });
  if (userIdForRevalidate) revalidatePath(`/admin/users/${userIdForRevalidate}`);
  return { ok: true };
}
