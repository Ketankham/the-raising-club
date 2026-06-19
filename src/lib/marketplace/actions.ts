"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type TargetType = "caregiver" | "family" | "job";

export type ToggleSaveResult =
  | { ok: true; saved: boolean }
  | { ok: false; reason: "unauthenticated" | "error" };

/** Toggle the heart/favorite for any marketplace card. RLS scopes to own rows. */
export async function toggleSave(
  targetType: TargetType,
  targetId: string,
  revalidate?: string,
): Promise<ToggleSaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  const { data: existing } = await supabase
    .from("marketplace_saves")
    .select("target_id")
    .eq("saver_user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("marketplace_saves")
      .delete()
      .eq("saver_user_id", user.id)
      .eq("target_type", targetType)
      .eq("target_id", targetId);
    if (error) return { ok: false, reason: "error" };
    if (revalidate) revalidatePath(revalidate);
    return { ok: true, saved: false };
  }

  const { error } = await supabase
    .from("marketplace_saves")
    .insert({ saver_user_id: user.id, target_type: targetType, target_id: targetId });
  if (error) return { ok: false, reason: "error" };
  if (revalidate) revalidatePath(revalidate);
  return { ok: true, saved: true };
}

export type CoHireResult =
  | { ok: true; count: number }
  | { ok: false; reason: "unauthenticated" | "no_jobs" | "error"; message?: string };

/**
 * Send the "Invite to Co-Hire" (Figma slide 1): invite a caregiver to one or
 * more of the inviter's own jobs, sharing one personal message. Writes a
 * job_invitations row per job (idempotent on re-invite). RLS (job_invites_manager
 * = job_can_manage) ensures the caller owns/ manages every job_post_id passed.
 */
export async function sendCoHireInvite(
  caregiverUserId: string,
  jobIds: string[],
  message: string,
): Promise<CoHireResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };
  if (!jobIds.length) return { ok: false, reason: "no_jobs" };

  const rows = jobIds.map((jobId) => ({
    job_post_id: jobId,
    caregiver_user_id: caregiverUserId,
    invited_by: user.id,
    message: message.trim() || null,
    status: "pending" as const,
  }));

  const { data, error } = await supabase
    .from("job_invitations")
    .upsert(rows, { onConflict: "job_post_id,caregiver_user_id" })
    .select("id");
  if (error) return { ok: false, reason: "error", message: error.message };

  revalidatePath("/connect");
  return { ok: true, count: data?.length ?? jobIds.length };
}

/**
 * Which of the current owner's jobs has this caregiver already applied to?
 * Returns { jobPostId: status }. RLS (japps_manager_read = job_can_manage) limits
 * the rows to applications on jobs the caller manages, so this is owner-scoped.
 * Used by the Invite-to-Co-Hire modal to show "Applied" next to those jobs.
 */
export async function getCaregiverApplicationsToMyJobs(
  caregiverUserId: string,
): Promise<Record<string, string>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};
  const { data } = await supabase
    .from("job_applications")
    .select("job_post_id, status")
    .eq("caregiver_user_id", caregiverUserId);
  const map: Record<string, string> = {};
  for (const a of data ?? []) map[a.job_post_id] = a.status;
  return map;
}

export type ApplyResult =
  | { ok: true }
  | { ok: false; reason: "unauthenticated" | "already_applied" | "error"; message?: string };

/** Caregiver applies to a job (Find Jobs → My Applications). */
export async function applyToJob(
  jobId: string,
  coverNote: string,
  proposedRate?: number | null,
): Promise<ApplyResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  const { data: existing } = await supabase
    .from("job_applications")
    .select("id")
    .eq("job_post_id", jobId)
    .eq("caregiver_user_id", user.id)
    .maybeSingle();
  if (existing) return { ok: false, reason: "already_applied" };

  const { error } = await supabase.from("job_applications").insert({
    job_post_id: jobId,
    caregiver_user_id: user.id,
    cover_note: coverNote.trim() || null,
    proposed_rate: proposedRate ?? null,
    status: "applied",
  });
  if (error) return { ok: false, reason: "error", message: error.message };

  revalidatePath("/jobs");
  revalidatePath("/dashboard/applications");
  return { ok: true };
}

export type AppStatusResult = { ok: true } | { ok: false; reason: "error"; message?: string };

/** Owner updates an application's status (e.g. shortlist / hire). */
export async function setApplicationStatus(
  applicationId: string,
  status: "applied" | "reviewing" | "shortlisted" | "rejected" | "hired" | "withdrawn",
): Promise<AppStatusResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "error", message: "Not signed in." };

  // Verify the caller owns the job this application belongs to.
  const { data: app } = await supabase
    .from("job_applications")
    .select("job_post_id, job_posts!inner(owner_user_id)")
    .eq("id", applicationId)
    .maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!app || (app as any).job_posts?.owner_user_id !== user.id) {
    return { ok: false, reason: "error", message: "Forbidden." };
  }

  const { error } = await supabase
    .from("job_applications")
    .update({ status })
    .eq("id", applicationId);
  if (error) return { ok: false, reason: "error", message: error.message };
  revalidatePath("/dashboard/posts");
  return { ok: true };
}

export type InviteResponseResult = { ok: true } | { ok: false; reason: "error"; message?: string };

/** Caregiver accepts/declines a co-hire invitation. */
export async function respondToInvitation(
  invitationId: string,
  status: "accepted" | "declined",
): Promise<InviteResponseResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("job_invitations")
    .update({ status, responded_at: new Date().toISOString() })
    .eq("id", invitationId);
  if (error) return { ok: false, reason: "error", message: error.message };
  revalidatePath("/dashboard/applications");
  return { ok: true };
}
