import { createClient } from "@/lib/supabase/server";

/**
 * Effective entitlement for the current user. Reads the denormalised snapshot
 * on profiles (kept fresh by recompute_entitlement on every billing / comp /
 * membership change) via the my_entitlement() RPC.
 *
 * NOTE (decision 4): this is INFRA ONLY — surface it in the UI, but do NOT gate
 * features on it yet. Intended gate points are marked `// TODO(entitlement)`.
 */
export type Entitlement = {
  planId: string | null;
  planKey: string | null;
  planName: string | null;
  status: "none" | "active" | "trialing" | "past_due" | "canceled" | "comp";
  interval: "monthly" | "annual" | null;
  entitlementUntil: string | null;
  adultSeats: number | null;
  staffSeats: number | null;
};

const NONE: Entitlement = {
  planId: null,
  planKey: null,
  planName: null,
  status: "none",
  interval: null,
  entitlementUntil: null,
  adultSeats: null,
  staffSeats: null,
};

export async function getMyEntitlement(): Promise<Entitlement> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_entitlement");
  if (!data) return NONE;
  const d = data as Record<string, unknown>;
  return {
    planId: (d.planId as string) ?? null,
    planKey: (d.planKey as string) ?? null,
    planName: (d.planName as string) ?? null,
    status: (d.status as Entitlement["status"]) ?? "none",
    interval: (d.interval as Entitlement["interval"]) ?? null,
    entitlementUntil: (d.entitlementUntil as string) ?? null,
    adultSeats: (d.adultSeats as number) ?? null,
    staffSeats: (d.staffSeats as number) ?? null,
  };
}

/** True when the user currently holds a paid/comp entitlement that hasn't lapsed. */
export function isEntitlementActive(e: Entitlement): boolean {
  if (e.status !== "active" && e.status !== "trialing" && e.status !== "comp") return false;
  if (e.entitlementUntil && new Date(e.entitlementUntil) < new Date()) return false;
  return true;
}
