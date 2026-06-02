import "server-only";
import { createClient } from "@/lib/supabase/server";
import { mapPlan, type Plan, type PlanRow } from "./types";

const SELECT =
  "id, key, audience, name, badge, subtitle, description, cta, highlight, is_free, is_custom, custom_label, unit, price_monthly_cents, price_annual_cents, adult_seats, staff_seats, features, stripe_product_id, stripe_price_monthly_id, stripe_price_annual_id, is_active, position";

/** All plans incl. inactive, for the admin console (admin RLS reads all). */
export async function listAllPlansForAdmin(): Promise<Plan[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("plans").select(SELECT).order("audience").order("position");
  return ((data as PlanRow[] | null) ?? []).map(mapPlan);
}

/** A single plan for the edit form (includes Stripe product id). */
export async function getPlanForAdmin(id: string): Promise<(Plan & { stripeProductId: string | null }) | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("plans").select(SELECT).eq("id", id).maybeSingle();
  if (!data) return null;
  const row = data as PlanRow & { stripe_product_id: string | null };
  return { ...mapPlan(row), stripeProductId: row.stripe_product_id ?? null };
}
