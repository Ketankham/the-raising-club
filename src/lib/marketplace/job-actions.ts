"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { JobFormInput } from "./types";

export type JobSaveResult =
  | { ok: true; id: string }
  | { ok: false; reason: "unauthenticated" | "validation" | "error"; message?: string };

function toRow(input: JobFormInput, ownerId: string) {
  return {
    owner_user_id: ownerId,
    org_id: input.orgId ?? null,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    care_type: input.careType ?? null,
    ages: input.ages,
    schedule: input.schedule,
    schedule_label: input.scheduleLabel?.trim() || null,
    pay_min: input.payMin ?? null,
    pay_max: input.payMax ?? null,
    pay_unit: input.payUnit || "hour",
    hours_per_week: input.hoursPerWeek ?? null,
    location_label: input.locationLabel?.trim() || null,
    zip_code: input.zipCode?.trim() || null,
    start_date: input.startDate || null,
    is_co_hire: input.isCoHire,
    openings: input.openings || 1,
    status: input.status,
  };
}

async function writeSkills(jobId: string, skills: string[]) {
  const supabase = await createClient();
  await supabase.from("job_skills").delete().eq("job_post_id", jobId);
  if (skills.length) {
    await supabase
      .from("job_skills")
      .insert(skills.map((skill_id) => ({ job_post_id: jobId, skill_id })));
  }
}

/** Create a job (My Care Posts → Post a job). RLS jobs_manage lets the owner
 *  insert with owner_user_id = self (and the read policy is owner-aware, so the
 *  INSERT … RETURNING via .select() succeeds — see 0022 guardrail). */
export async function createJob(input: JobFormInput): Promise<JobSaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };
  if (!input.title.trim()) return { ok: false, reason: "validation", message: "Title is required." };

  const { data, error } = await supabase
    .from("job_posts")
    .insert(toRow(input, user.id))
    .select("id")
    .single();
  if (error || !data) return { ok: false, reason: "error", message: error?.message };

  await writeSkills(data.id, input.skills);
  revalidatePath("/dashboard/posts");
  revalidatePath("/jobs");
  return { ok: true, id: data.id };
}

/** Update a job the current user manages. */
export async function updateJob(id: string, input: JobFormInput): Promise<JobSaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };
  if (!input.title.trim()) return { ok: false, reason: "validation", message: "Title is required." };

  const row = toRow(input, user.id);
  // don't reassign ownership on edit
  delete (row as { owner_user_id?: string }).owner_user_id;

  const { error } = await supabase.from("job_posts").update(row).eq("id", id);
  if (error) return { ok: false, reason: "error", message: error.message };

  await writeSkills(id, input.skills);
  revalidatePath("/dashboard/posts");
  revalidatePath(`/dashboard/posts/${id}/edit`);
  revalidatePath("/jobs");
  return { ok: true, id };
}

export type JobMutResult = { ok: true } | { ok: false; reason: "error"; message?: string };

/** Flip a job's status (e.g. publish a draft → 'open', pause, close, fill). */
export async function setJobStatus(
  id: string,
  status: "draft" | "open" | "closed" | "filled",
): Promise<JobMutResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("job_posts").update({ status }).eq("id", id);
  if (error) return { ok: false, reason: "error", message: error.message };
  revalidatePath("/dashboard/posts");
  revalidatePath("/jobs");
  return { ok: true };
}

export async function deleteJob(id: string): Promise<JobMutResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("job_posts").delete().eq("id", id);
  if (error) return { ok: false, reason: "error", message: error.message };
  revalidatePath("/dashboard/posts");
  return { ok: true };
}
