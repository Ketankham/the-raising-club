import { createClient } from "@/lib/supabase/server";
import type { CaregiverCard, MarketplaceFilters } from "./types";
import { ageGroupsOverlapMonths, careSettingsToTypes } from "./format";

/* eslint-disable @typescript-eslint/no-explicit-any */

function mapRow(r: any, savedIds: Set<string>): CaregiverCard {
  return {
    userId: r.userId,
    firstName: r.firstName,
    lastInitial: r.lastInitial ?? "",
    preferredName: r.preferredName,
    zip: r.zip,
    avatarUrl: r.avatarUrl,
    headline: r.headline,
    about: r.about,
    experienceLevel: r.experienceLevel,
    rateAmount: r.rateAmount != null ? Number(r.rateAmount) : null,
    rateUnit: r.rateUnit,
    lookingForPaidWork: !!r.lookingForPaidWork,
    idVerified: !!r.idVerified,
    ratingAvg: r.ratingAvg != null ? Number(r.ratingAvg) : null,
    ratingCount: Number(r.ratingCount ?? 0),
    skills: r.skills ?? [],
    ageGroups: r.ageGroups ?? [],
    careSettings: r.careSettings ?? [],
    isSaved: savedIds.has(r.userId),
  };
}

function matches(c: CaregiverCard, f: MarketplaceFilters): boolean {
  if (f.q) {
    const q = f.q.toLowerCase();
    const hay = `${c.firstName ?? ""} ${c.headline ?? ""} ${c.about ?? ""} ${c.skills.join(" ")}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (f.careTypes?.length) {
    const types = careSettingsToTypes(c.careSettings);
    if (!types.some((t) => f.careTypes!.includes(t))) return false;
  }
  if (!ageGroupsOverlapMonths(c.ageGroups, f.ageMin, f.ageMax)) return false;
  if (f.where) {
    const w = f.where.toLowerCase();
    if (!`${c.zip ?? ""}`.toLowerCase().includes(w)) return false;
  }
  return true;
}

/**
 * List published caregivers for the Find Caregivers grid. Reads the public-safe
 * card data via the marketplace_caregiver_cards() SECURITY DEFINER function
 * (profiles is owner-only by RLS). Filtering is done in JS (like listEvents).
 */
export async function listCaregivers(filters: MarketplaceFilters = {}): Promise<CaregiverCard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("marketplace_caregiver_cards");
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
      .eq("target_type", "caregiver");
    for (const s of saves ?? []) savedIds.add(s.target_id);
  }

  return (data as any[]).map((r) => mapRow(r, savedIds)).filter((c) => matches(c, filters));
}
