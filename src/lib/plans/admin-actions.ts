"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/guards";
import type { Feature, PlanAudience } from "./types";

type Result = { ok: true; id?: string } | { ok: false; error: string };

export type PlanInput = {
  key: string;
  audience: PlanAudience;
  name: string;
  badge: string;
  subtitle: string;
  description: string;
  cta: string;
  highlight: boolean;
  isFree: boolean;
  isCustom: boolean;
  customLabel: string;
  unit: string;
  priceMonthly: string; // dollars, as typed
  priceAnnual: string; // dollars, as typed
  adultSeats: string;
  staffSeats: string;
  features: Feature[];
  stripeProductId: string;
  stripePriceMonthlyId: string;
  stripePriceAnnualId: string;
  isActive: boolean;
  position: string;
};

const dollarsToCents = (v: string): number | null => {
  const n = Number(v);
  return v.trim() === "" || Number.isNaN(n) ? null : Math.round(n * 100);
};
const toSmallint = (v: string): number | null => {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
};

function toRow(input: PlanInput) {
  return {
    audience: input.audience,
    name: input.name.trim(),
    badge: input.badge.trim() || null,
    subtitle: input.subtitle.trim() || null,
    description: input.description.trim(),
    cta: input.cta.trim() || "Get Started",
    highlight: input.highlight,
    is_free: input.isFree,
    is_custom: input.isCustom,
    custom_label: input.customLabel.trim() || null,
    unit: input.unit.trim() || null,
    price_monthly_cents: input.isFree || input.isCustom ? null : dollarsToCents(input.priceMonthly),
    price_annual_cents: input.isFree || input.isCustom ? null : dollarsToCents(input.priceAnnual),
    adult_seats: toSmallint(input.adultSeats),
    staff_seats: toSmallint(input.staffSeats),
    features: input.features.filter((f) => f.label.trim() || f.body.trim()),
    stripe_product_id: input.stripeProductId.trim() || null,
    stripe_price_monthly_id: input.stripePriceMonthlyId.trim() || null,
    stripe_price_annual_id: input.stripePriceAnnualId.trim() || null,
    is_active: input.isActive,
    position: toSmallint(input.position) ?? 0,
  };
}

export async function createPlan(input: PlanInput): Promise<Result> {
  const { supabase } = await requireAdmin();
  const key = input.key.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_");
  if (!key) return { ok: false, error: "A stable key is required." };
  if (!input.name.trim()) return { ok: false, error: "Name is required." };

  const { data, error } = await supabase
    .from("plans")
    .insert({ key, ...toRow(input) })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/plans");
  revalidatePath("/membership");
  return { ok: true, id: data.id };
}

export async function updatePlan(id: string, input: PlanInput): Promise<Result> {
  const { supabase } = await requireAdmin();
  if (!input.name.trim()) return { ok: false, error: "Name is required." };
  // key is immutable once created (persisted on user_plans) — not updated here.
  const { error } = await supabase.from("plans").update(toRow(input)).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/plans");
  revalidatePath(`/admin/plans/${id}/edit`);
  revalidatePath("/membership");
  return { ok: true, id };
}

export async function setPlanActive(id: string, isActive: boolean): Promise<Result> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("plans").update({ is_active: isActive }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/plans");
  revalidatePath("/membership");
  return { ok: true, id };
}
