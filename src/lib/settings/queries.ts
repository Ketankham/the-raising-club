import { requireOnboardedProfile } from "@/lib/guards";

export type SettingsRole = "parent" | "caregiver" | "organization";

export interface SettingsData {
  role: SettingsRole;
  // Shared identity (profiles)
  firstName: string | null;
  lastName: string | null;
  preferredName: string | null;
  email: string | null;
  phone: string | null;
  zip: string | null;
  registeredAt: string | null;
  // Membership
  planKey: string | null;
  planInterval: "monthly" | "annual";
  // Role extras
  parent: { childTerm: string | null; intents: string[] } | null;
  organization: { name: string; about: string | null } | null;
}

/** Account-level settings for the current signed-in user (any non-admin role). */
export async function getSettingsData(): Promise<SettingsData> {
  const { supabase, user, profile } = await requireOnboardedProfile();
  const role = profile.role as SettingsRole;

  let parent: SettingsData["parent"] = null;
  let organization: SettingsData["organization"] = null;

  if (role === "parent") {
    const { data } = await supabase
      .from("parent_profiles")
      .select("child_term, intents")
      .eq("user_id", user.id)
      .maybeSingle();
    parent = { childTerm: data?.child_term ?? null, intents: data?.intents ?? [] };
  } else if (role === "organization") {
    const { data } = await supabase
      .from("organizations")
      .select("name, about")
      .eq("owner_user_id", user.id)
      .maybeSingle();
    organization = data ? { name: data.name, about: data.about } : null;
  }

  return {
    role,
    firstName: profile.first_name,
    lastName: profile.last_name,
    preferredName: profile.preferred_name,
    email: profile.email,
    phone: profile.phone,
    zip: profile.zip_code,
    registeredAt: profile.registered_at,
    planKey: profile.plan_key ?? null,
    planInterval: (profile.plan_interval as "monthly" | "annual") ?? "monthly",
    parent,
    organization,
  };
}
