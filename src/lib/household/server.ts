import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Find the caller's active household, creating one (with them as owner) if none
 * exists. Works with either the user's server client (RLS lets an owner create
 * their own household + self membership) or the service-role / admin client
 * (is_admin / service_role bypass). Returns the household id or null on failure.
 */
export async function ensureHousehold(
  client: SupabaseClient,
  userId: string,
  name: string | null,
): Promise<string | null> {
  const { data: existing } = await client
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("joined_at")
    .limit(1)
    .maybeSingle();
  if (existing) return existing.household_id as string;

  const { data: hh, error } = await client
    .from("households")
    .insert({ owner_user_id: userId, name })
    .select("id")
    .single();
  if (error || !hh) return null;

  await client
    .from("household_members")
    .insert({ household_id: hh.id, user_id: userId, member_role: "owner", status: "active" });
  return hh.id as string;
}

/** The caller's active household id, if any (no creation). */
export async function findHousehold(client: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await client
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("joined_at")
    .limit(1)
    .maybeSingle();
  return (data?.household_id as string) ?? null;
}
