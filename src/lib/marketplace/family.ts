import { createClient } from "@/lib/supabase/server";
import type { FamilyCard, FamilyListingInput, MarketplaceFilters, TraitOption } from "./types";
import { ageGroupsOverlapMonths } from "./format";

/* eslint-disable @typescript-eslint/no-explicit-any */

function mapRow(r: any, savedIds: Set<string>): FamilyCard {
  return {
    userId: r.userId,
    householdName: r.householdName ?? "A family",
    headline: r.headline,
    about: r.about,
    careNeeds: r.careNeeds,
    locationLabel: r.locationLabel,
    zip: r.zip,
    budgetMin: r.budgetMin != null ? Number(r.budgetMin) : null,
    budgetMax: r.budgetMax != null ? Number(r.budgetMax) : null,
    budgetUnit: r.budgetUnit ?? "hour",
    careType: r.careType,
    coverPhotoUrl: r.coverPhotoUrl,
    coHireInterested: !!r.coHireInterested,
    childrenCount: Number(r.childrenCount ?? 0),
    ageGroups: r.ageGroups ?? [],
    schedule: r.schedule ?? [],
    openTo: r.openTo ?? [],
    traits: r.traits ?? [],
    isSaved: savedIds.has(r.userId),
  };
}

function matches(c: FamilyCard, f: MarketplaceFilters): boolean {
  if (f.q) {
    const q = f.q.toLowerCase();
    const hay = `${c.householdName} ${c.about ?? ""} ${c.careNeeds ?? ""} ${c.traits.join(" ")}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (f.careTypes?.length && (!c.careType || !f.careTypes.includes(c.careType))) return false;
  if (!ageGroupsOverlapMonths(c.ageGroups, f.ageMin, f.ageMax)) return false;
  if (f.where && !`${c.locationLabel ?? ""} ${c.zip ?? ""}`.toLowerCase().includes(f.where.toLowerCase())) return false;
  return true;
}

/** Published family listings for Connect Families (via the SECURITY DEFINER RPC,
 *  since profiles/children are owner-only). JS-side filtering like listEvents. */
export async function listFamilies(filters: MarketplaceFilters = {}): Promise<FamilyCard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("marketplace_family_cards");
  if (error || !data) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const savedIds = new Set<string>();
  if (user) {
    const { data: saves } = await supabase
      .from("marketplace_saves")
      .select("target_id")
      .eq("saver_user_id", user.id)
      .eq("target_type", "family");
    for (const s of saves ?? []) savedIds.add(s.target_id);
  }

  return (data as any[]).map((r) => mapRow(r, savedIds)).filter((c) => matches(c, filters));
}

/** Trait chip options for the editor (public-read taxonomy). */
export async function getTraitOptions(): Promise<TraitOption[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("family_traits").select("id, label").order("position");
  return (data ?? []).map((t: any) => ({ id: t.id, label: t.label }));
}

/** The current user's own family listing for the editor (or null if none). */
export async function getMyFamilyListing(): Promise<FamilyListingInput | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: f } = await supabase
    .from("family_listings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!f) return null;

  const [ages, sched, open, traits] = await Promise.all([
    supabase.from("family_listing_age_groups").select("age").eq("user_id", user.id),
    supabase.from("family_listing_schedule").select("slot").eq("user_id", user.id),
    supabase.from("family_listing_open_to").select("kind").eq("user_id", user.id),
    supabase.from("family_listing_traits").select("trait_id").eq("user_id", user.id),
  ]);

  return {
    householdName: f.household_name ?? "",
    headline: f.headline ?? "",
    about: f.about ?? "",
    careNeeds: f.care_needs ?? "",
    locationLabel: f.location_label ?? "",
    zipCode: f.zip_code ?? "",
    budgetMin: f.budget_min != null ? Number(f.budget_min) : null,
    budgetMax: f.budget_max != null ? Number(f.budget_max) : null,
    budgetUnit: f.budget_unit ?? "hour",
    careType: f.care_type,
    coverPhotoUrl: f.cover_photo_url ?? "",
    coHireInterested: !!f.co_hire_interested,
    ageGroups: (ages.data ?? []).map((r: any) => r.age),
    schedule: (sched.data ?? []).map((r: any) => r.slot),
    openTo: (open.data ?? []).map((r: any) => r.kind),
    traits: (traits.data ?? []).map((r: any) => r.trait_id),
    isPublished: !!f.is_published,
  };
}

export type { FamilyListingInput };
