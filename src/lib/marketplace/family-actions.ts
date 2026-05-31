"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FamilyListingInput } from "./types";

export type FamilySaveResult =
  | { ok: true; published: boolean }
  | { ok: false; reason: "unauthenticated" | "error"; message?: string };

/** Create/update the current user's family listing + its child sets (opt-in
 *  publish). RLS family_listings_own scopes everything to the owner. */
export async function saveFamilyListing(input: FamilyListingInput): Promise<FamilySaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  const { error } = await supabase.from("family_listings").upsert({
    user_id: user.id,
    household_name: input.householdName?.trim() || null,
    headline: input.headline?.trim() || null,
    about: input.about?.trim() || null,
    care_needs: input.careNeeds?.trim() || null,
    location_label: input.locationLabel?.trim() || null,
    zip_code: input.zipCode?.trim() || null,
    budget_min: input.budgetMin ?? null,
    budget_max: input.budgetMax ?? null,
    budget_unit: input.budgetUnit || "hour",
    care_type: input.careType ?? null,
    cover_photo_url: input.coverPhotoUrl?.trim() || null,
    co_hire_interested: input.coHireInterested,
    is_published: input.isPublished,
  });
  if (error) return { ok: false, reason: "error", message: error.message };

  // Replace child sets.
  const uid = user.id;
  await Promise.all([
    supabase.from("family_listing_age_groups").delete().eq("user_id", uid),
    supabase.from("family_listing_schedule").delete().eq("user_id", uid),
    supabase.from("family_listing_open_to").delete().eq("user_id", uid),
    supabase.from("family_listing_traits").delete().eq("user_id", uid),
  ]);
  const ins: PromiseLike<unknown>[] = [];
  if (input.ageGroups.length)
    ins.push(supabase.from("family_listing_age_groups").insert(input.ageGroups.map((age) => ({ user_id: uid, age }))));
  if (input.schedule.length)
    ins.push(supabase.from("family_listing_schedule").insert(input.schedule.map((slot) => ({ user_id: uid, slot }))));
  if (input.openTo.length)
    ins.push(supabase.from("family_listing_open_to").insert(input.openTo.map((kind) => ({ user_id: uid, kind }))));
  if (input.traits.length)
    ins.push(supabase.from("family_listing_traits").insert(input.traits.map((trait_id) => ({ user_id: uid, trait_id }))));
  await Promise.all(ins);

  revalidatePath("/connect/families");
  revalidatePath("/dashboard/family-listing");
  return { ok: true, published: input.isPublished };
}
