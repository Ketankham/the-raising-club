import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** A plan assignment shown in the admin user detail (across user/household/org). */
export type UserPlanRow = {
  id: string;
  subjectType: "user" | "household" | "org";
  planName: string | null;
  planKey: string | null;
  interval: string;
  source: "stripe" | "manual";
  status: string;
  startsAt: string;
  endsAt: string | null;
  currentPeriodEnd: string | null;
};

export type UserPlanSummary = {
  /** Live snapshot from profiles (what gates access). */
  snapshot: { planName: string | null; status: string; interval: string | null; entitlementUntil: string | null };
  /** All assignments touching this user (their own + household + owned org). */
  assignments: UserPlanRow[];
};

/** Plans attached to a user — for the admin user detail "quick view". Admin-gate the caller. */
export async function getUserPlanSummary(userId: string): Promise<UserPlanSummary> {
  const admin = createAdminClient();
  const empty: UserPlanSummary = {
    snapshot: { planName: null, status: "none", interval: null, entitlementUntil: null },
    assignments: [],
  };
  if (!admin) return empty;

  // Snapshot from profiles + plan name.
  const { data: prof } = await admin
    .from("profiles")
    .select("plan_status, plan_interval, entitlement_until, plans:active_plan_id(name)")
    .eq("id", userId)
    .maybeSingle();

  // Collect the subjects this user belongs to.
  const subjectIds: { type: "user" | "household" | "org"; id: string }[] = [{ type: "user", id: userId }];
  const { data: hm } = await admin.from("household_members").select("household_id").eq("user_id", userId).eq("status", "active");
  for (const r of hm ?? []) subjectIds.push({ type: "household", id: r.household_id as string });
  const { data: orgs } = await admin.from("organizations").select("id").eq("owner_user_id", userId);
  for (const r of orgs ?? []) subjectIds.push({ type: "org", id: r.id as string });

  const orFilter = subjectIds.map((s) => `and(subject_type.eq.${s.type},subject_id.eq.${s.id})`).join(",");
  const { data: ups } = await admin
    .from("user_plans")
    .select("id, subject_type, subject_id, interval, source, status, starts_at, ends_at, current_period_end, plans(name, key)")
    .or(orFilter)
    .order("created_at", { ascending: false });

  const assignments: UserPlanRow[] = (ups ?? []).map((r: RawUserPlan) => {
    const plan = Array.isArray(r.plans) ? r.plans[0] : r.plans;
    return {
      id: r.id,
      subjectType: r.subject_type,
      planName: plan?.name ?? null,
      planKey: plan?.key ?? null,
      interval: r.interval,
      source: r.source,
      status: r.status,
      startsAt: r.starts_at,
      endsAt: r.ends_at,
      currentPeriodEnd: r.current_period_end,
    };
  });

  const profPlans = prof?.plans as { name: string }[] | { name: string } | null | undefined;
  const snapPlan = Array.isArray(profPlans) ? profPlans[0] : profPlans;
  return {
    snapshot: {
      planName: snapPlan?.name ?? null,
      status: (prof?.plan_status as string) ?? "none",
      interval: (prof?.plan_interval as string) ?? null,
      entitlementUntil: (prof?.entitlement_until as string) ?? null,
    },
    assignments,
  };
}

type RawUserPlan = {
  id: string;
  subject_type: "user" | "household" | "org";
  subject_id: string;
  interval: string;
  source: "stripe" | "manual";
  status: string;
  starts_at: string;
  ends_at: string | null;
  current_period_end: string | null;
  plans: { name: string | null; key: string | null } | { name: string | null; key: string | null }[] | null;
};
