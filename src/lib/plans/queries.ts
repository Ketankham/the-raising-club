import { createClient } from "@/lib/supabase/server";
import {
  mapPlan,
  tabForRole,
  TAB_META,
  AUDIENCE_ORDER,
  type Plan,
  type PlanRow,
  type Tab,
  type TabId,
} from "./types";

export { tabForRole } from "./types";
export type { Plan, Tab, TabId, Feature, PlanAudience } from "./types";

const SELECT =
  "id, key, audience, name, badge, subtitle, description, cta, highlight, is_free, is_custom, custom_label, unit, price_monthly_cents, price_annual_cents, adult_seats, staff_seats, features, stripe_price_monthly_id, stripe_price_annual_id, is_active, position";

/** All plans (active only unless includeInactive), ordered for display. */
export async function listPlans(opts: { audience?: TabId; includeInactive?: boolean } = {}): Promise<Plan[]> {
  const supabase = await createClient();
  let q = supabase.from("plans").select(SELECT).order("audience").order("position");
  if (opts.audience) q = q.eq("audience", opts.audience);
  if (!opts.includeInactive) q = q.eq("is_active", true);
  const { data } = await q;
  return ((data as PlanRow[] | null) ?? []).map(mapPlan);
}

/** Active plans for a role's audience, in display order. */
export async function plansForRole(role: string): Promise<Plan[]> {
  return listPlans({ audience: tabForRole(role) });
}

/** Look up a single plan by its stable key (across all audiences). */
export async function planByKey(key: string | null | undefined): Promise<Plan | null> {
  if (!key) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("plans").select(SELECT).eq("key", key).maybeSingle();
  return data ? mapPlan(data as PlanRow) : null;
}

/** The free starter plan for a role (the plan a user is on when plan_key is null). */
export async function freePlanForRole(role: string): Promise<Plan | null> {
  const plans = await plansForRole(role);
  return plans.find((p) => p.price === "free") ?? null;
}

/** Marketing page: TAB_META chrome composed with active plans per audience. */
export async function listTabs(): Promise<Tab[]> {
  const plans = await listPlans();
  return AUDIENCE_ORDER.map((id) => ({
    ...TAB_META[id],
    plans: plans.filter((p) => p.audience === id),
  }));
}
