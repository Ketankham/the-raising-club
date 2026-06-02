import { createClient } from "@/lib/supabase/server";
import type { JobCard, JobForEdit, MarketplaceFilters, OwnJobOption, SkillOption } from "./types";
import { ageGroupsOverlapMonths } from "./format";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * The current user's own jobs that can receive a co-hire invite (draft + open),
 * for the Invite-to-Co-Hire modal. RLS lets an owner read their own rows
 * regardless of status.
 */
export async function getMyJobOptions(): Promise<OwnJobOption[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("job_posts")
    .select("id, title, status, created_at")
    .eq("owner_user_id", user.id)
    .in("status", ["draft", "open"])
    .order("created_at", { ascending: false });

  return (data ?? []).map((j: any) => ({ id: j.id, title: j.title, status: j.status }));
}

function mapJob(j: any): JobCard {
  return {
    id: j.id,
    title: j.title,
    description: j.description,
    status: j.status,
    careType: j.care_type,
    locationLabel: j.location_label,
    payMin: j.pay_min != null ? Number(j.pay_min) : null,
    payMax: j.pay_max != null ? Number(j.pay_max) : null,
    payUnit: j.pay_unit ?? "hour",
    hoursPerWeek: j.hours_per_week,
    scheduleLabel: j.schedule_label,
    schedule: j.schedule ?? [],
    ages: j.ages ?? [],
    skills: (j.job_skills ?? []).map((s: any) => s.skills?.label).filter(Boolean),
    isCoHire: !!j.is_co_hire,
    openings: j.openings ?? 1,
    startDate: j.start_date,
    publishedAt: j.published_at,
    isOrg: !!j.org_id,
  };
}

const JOB_SELECT = `id, title, description, status, care_type, location_label,
  pay_min, pay_max, pay_unit, hours_per_week, schedule_label, schedule, ages,
  is_co_hire, openings, start_date, published_at, org_id,
  job_skills ( skills ( label ) )`;

function matchesJob(j: JobCard, f: MarketplaceFilters): boolean {
  if (f.q) {
    const q = f.q.toLowerCase();
    const hay = `${j.title} ${j.description ?? ""} ${j.skills.join(" ")} ${j.locationLabel ?? ""}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (f.careTypes?.length && (!j.careType || !f.careTypes.includes(j.careType))) return false;
  if (!ageGroupsOverlapMonths(j.ages, f.ageMin, f.ageMax)) return false;
  if (f.where && !`${j.locationLabel ?? ""}`.toLowerCase().includes(f.where.toLowerCase())) return false;
  return true;
}

/** Open jobs for the caregiver-facing Find Jobs grid (RLS exposes status='open'). */
export async function listOpenJobs(filters: MarketplaceFilters = {}): Promise<JobCard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_posts")
    .select(JOB_SELECT)
    .eq("status", "open")
    .order("published_at", { ascending: false });
  if (error || !data) return [];

  // Annotate with the current user's application status + saved state, if any.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const appByJob = new Map<string, string>();
  const savedIds = new Set<string>();
  if (user) {
    const { data: apps } = await supabase
      .from("job_applications")
      .select("job_post_id, status")
      .eq("caregiver_user_id", user.id);
    for (const a of apps ?? []) appByJob.set(a.job_post_id, a.status);
    const { data: saves } = await supabase
      .from("marketplace_saves")
      .select("target_id")
      .eq("saver_user_id", user.id)
      .eq("target_type", "job");
    for (const s of saves ?? []) savedIds.add(s.target_id);
  }

  return (data as any[])
    .map(mapJob)
    .map((j) => ({ ...j, myApplicationStatus: appByJob.get(j.id) ?? null, isSaved: savedIds.has(j.id) }))
    .filter((j) => matchesJob(j, filters));
}

/** A single job (RLS: open OR owner/manager OR applicant/invitee). */
export async function getJobById(id: string): Promise<JobCard | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_posts")
    .select(JOB_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const job = mapJob(data);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: app } = await supabase
      .from("job_applications")
      .select("status")
      .eq("job_post_id", id)
      .eq("caregiver_user_id", user.id)
      .maybeSingle();
    job.myApplicationStatus = app?.status ?? null;
  }
  return job;
}

/** Jobs posted under an organization (org roles management page). */
export async function listOrgJobPosts(orgId: string): Promise<JobCard[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("job_posts")
    .select(`${JOB_SELECT}, job_applications ( id )`)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((j: any) => ({
    ...mapJob(j),
    applicantCount: (j.job_applications ?? []).length,
  }));
}

/** The current user's posted jobs (My Care Posts). */
export async function listMyJobs(): Promise<JobCard[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("job_posts")
    .select(`${JOB_SELECT}, job_applications ( id )`)
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []).map((j: any) => ({
    ...mapJob(j),
    applicantCount: (j.job_applications ?? []).length,
  }));
}

/** Desired-skills options for the job form (skills taxonomy is public-read). */
export async function getSkillsList(): Promise<SkillOption[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("skills").select("id, label").order("label");
  return (data ?? []).map((s: any) => ({ id: s.id, label: s.label }));
}

/** Load a job the current user manages, for the edit form. Returns null unless
 *  the caller OWNS it (or manages it as an org/platform admin) — so a non-owner
 *  can't open the editor for someone else's job even though RLS lets them read
 *  an OPEN job. */
export async function getJobForEdit(id: string): Promise<JobForEdit | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("job_posts")
    .select(`id, title, description, care_type, ages, schedule, schedule_label,
      pay_min, pay_max, pay_unit, hours_per_week, location_label, zip_code,
      start_date, is_co_hire, openings, org_id, owner_user_id, status,
      job_skills ( skill_id )`)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const j: any = data;

  // Ownership guard: owner, or (org job) an org admin / platform admin.
  if (j.owner_user_id !== user.id) {
    const { data: canManage } = await supabase.rpc("job_can_manage", { target_job: id });
    if (!canManage) return null;
  }
  return {
    id: j.id,
    title: j.title,
    description: j.description ?? "",
    careType: j.care_type,
    ages: j.ages ?? [],
    schedule: j.schedule ?? [],
    scheduleLabel: j.schedule_label ?? "",
    payMin: j.pay_min != null ? Number(j.pay_min) : null,
    payMax: j.pay_max != null ? Number(j.pay_max) : null,
    payUnit: j.pay_unit ?? "hour",
    hoursPerWeek: j.hours_per_week,
    locationLabel: j.location_label ?? "",
    zipCode: j.zip_code ?? "",
    startDate: j.start_date,
    isCoHire: !!j.is_co_hire,
    openings: j.openings ?? 1,
    skills: (j.job_skills ?? []).map((s: any) => s.skill_id),
    orgId: j.org_id,
    status: j.status === "open" ? "open" : "draft",
  };
}

export interface JobApplicant {
  applicationId: string;
  status: string;
  coverNote: string | null;
  proposedRate: number | null;
  createdAt: string;
  caregiverUserId: string;
  name: string;
  avatarUrl: string | null;
  headline: string | null;
}

/** Applicants on a job the current user manages (RLS japps_manager_read).
 *  Caregiver identity comes from the public_caregiver() definer fn. */
export async function getJobApplicants(jobId: string): Promise<{ title: string; applicants: JobApplicant[] } | null> {
  const supabase = await createClient();
  const { data: job } = await supabase.from("job_posts").select("title").eq("id", jobId).maybeSingle();
  if (!job) return null;

  const { data: apps } = await supabase
    .from("job_applications")
    .select("id, status, cover_note, proposed_rate, created_at, caregiver_user_id")
    .eq("job_post_id", jobId)
    .order("created_at", { ascending: false });

  const applicants: JobApplicant[] = [];
  for (const a of apps ?? []) {
    const { data: pub } = await supabase.rpc("public_caregiver", { uid: a.caregiver_user_id });
    const p: any = pub ?? {};
    const first = p.preferredName || p.firstName || "Caregiver";
    applicants.push({
      applicationId: a.id,
      status: a.status,
      coverNote: a.cover_note,
      proposedRate: a.proposed_rate != null ? Number(a.proposed_rate) : null,
      createdAt: a.created_at,
      caregiverUserId: a.caregiver_user_id,
      name: p.lastInitial ? `${first} ${p.lastInitial}.` : first,
      avatarUrl: p.avatarUrl ?? null,
      headline: p.headline ?? null,
    });
  }
  return { title: job.title as string, applicants };
}

/** Orgs the current user can post jobs on behalf of (owner/admin). */
export async function getMyOrgOptions(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("organization_members")
    .select("organizations ( id, name )")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("member_role", ["owner", "admin"]);
  return (data ?? [])
    .map((m: any) => m.organizations)
    .filter(Boolean)
    .map((o: any) => ({ id: o.id, name: o.name }));
}
