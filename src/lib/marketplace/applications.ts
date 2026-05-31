import { createClient } from "@/lib/supabase/server";
import type { ApplicationItem, InvitationItem } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function jobBits(j: any) {
  return {
    jobId: j?.id,
    jobTitle: j?.title ?? "Job",
    jobStatus: j?.status,
    payMin: j?.pay_min != null ? Number(j.pay_min) : null,
    payMax: j?.pay_max != null ? Number(j.pay_max) : null,
    payUnit: j?.pay_unit ?? "hour",
    locationLabel: j?.location_label ?? null,
  };
}

/** The current caregiver's job applications (My Applications). RLS japps_caregiver
 *  scopes to own rows; the embedded job is readable via the applicant clause. */
export async function listMyApplications(): Promise<ApplicationItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("job_applications")
    .select(`id, status, cover_note, proposed_rate, created_at,
      job_posts ( id, title, status, pay_min, pay_max, pay_unit, location_label )`)
    .eq("caregiver_user_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []).map((a: any) => ({
    id: a.id,
    status: a.status,
    coverNote: a.cover_note,
    proposedRate: a.proposed_rate != null ? Number(a.proposed_rate) : null,
    createdAt: a.created_at,
    ...jobBits(a.job_posts),
  }));
}

/** Co-hire invitations the current caregiver received. */
export async function listMyInvitations(): Promise<InvitationItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("job_invitations")
    .select(`id, status, message, created_at,
      job_posts ( id, title, status, pay_min, pay_max, pay_unit, location_label )`)
    .eq("caregiver_user_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []).map((i: any) => ({
    id: i.id,
    status: i.status,
    message: i.message,
    createdAt: i.created_at,
    ...jobBits(i.job_posts),
  }));
}
