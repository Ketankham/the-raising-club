import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Admin-only "who is on this plan" listing. Uses the service-role client so it
 * can resolve subject names across users / orgs / households (all owner-scoped
 * by RLS). Gate every caller behind requireAdmin.
 */
export type SubscriberRow = {
  id: string;
  subjectType: "user" | "household" | "org";
  subjectName: string;
  subjectEmail: string | null;
  planName: string | null;
  interval: string;
  source: "stripe" | "manual";
  status: string;
  startsAt: string;
  endsAt: string | null;
  currentPeriodEnd: string | null;
};

const ACTIVE_STATUSES = ["active", "trialing", "comp", "past_due"];

export async function listSubscribers(opts: { planId?: string; includeInactive?: boolean } = {}): Promise<SubscriberRow[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  let q = admin
    .from("user_plans")
    .select(
      "id, subject_type, subject_id, interval, source, status, starts_at, ends_at, current_period_end, plans(name)",
    )
    .order("created_at", { ascending: false });
  if (opts.planId) q = q.eq("plan_id", opts.planId);
  if (!opts.includeInactive) q = q.in("status", ACTIVE_STATUSES);

  const { data } = await q;
  const rows = (data as RawRow[] | null) ?? [];
  if (rows.length === 0) return [];

  // Batch-resolve subject names.
  const userIds = rows.filter((r) => r.subject_type === "user").map((r) => r.subject_id);
  const orgIds = rows.filter((r) => r.subject_type === "org").map((r) => r.subject_id);
  const householdIds = rows.filter((r) => r.subject_type === "household").map((r) => r.subject_id);

  const [profiles, orgs, households] = await Promise.all([
    userIds.length
      ? admin.from("profiles").select("id, first_name, last_name, preferred_name, email").in("id", userIds)
      : Promise.resolve({ data: [] }),
    orgIds.length ? admin.from("organizations").select("id, name").in("id", orgIds) : Promise.resolve({ data: [] }),
    householdIds.length
      ? admin.from("households").select("id, name").in("id", householdIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap = new Map((profiles.data ?? []).map((p: ProfileLite) => [p.id, p]));
  const orgMap = new Map((orgs.data ?? []).map((o: { id: string; name: string }) => [o.id, o.name]));
  const householdMap = new Map((households.data ?? []).map((h: { id: string; name: string }) => [h.id, h.name]));

  return rows.map((r) => {
    let name = "—";
    let email: string | null = null;
    if (r.subject_type === "user") {
      const p = profileMap.get(r.subject_id);
      name = p ? p.preferred_name || `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email || "User" : "User";
      email = p?.email ?? null;
    } else if (r.subject_type === "org") {
      name = orgMap.get(r.subject_id) ?? "Organization";
    } else {
      name = householdMap.get(r.subject_id) ?? "Household";
    }
    const planName = Array.isArray(r.plans) ? (r.plans[0]?.name ?? null) : (r.plans?.name ?? null);
    return {
      id: r.id,
      subjectType: r.subject_type,
      subjectName: name,
      subjectEmail: email,
      planName,
      interval: r.interval,
      source: r.source,
      status: r.status,
      startsAt: r.starts_at,
      endsAt: r.ends_at,
      currentPeriodEnd: r.current_period_end,
    };
  });
}

type ProfileLite = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
  email: string | null;
};

type RawRow = {
  id: string;
  subject_type: "user" | "household" | "org";
  subject_id: string;
  interval: string;
  source: "stripe" | "manual";
  status: string;
  starts_at: string;
  ends_at: string | null;
  current_period_end: string | null;
  plans: { name: string | null } | { name: string | null }[] | null;
};
