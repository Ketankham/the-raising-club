import { createClient } from "@/lib/supabase/server";

export interface OrgProfileData {
  orgId: string;
  name: string;
  about: string | null;
  programTypes: string[];
  agesServed: string[];
  size: string | null;
  multiLocation: boolean;
  intents: string[];
  contactRoleTitle: string | null;
  locations: { id: string; label: string | null; zip_code: string | null; is_primary: boolean }[];
  memberCount: number;
  pendingInvites: { id: string; email: string; status: string }[];
  jobs: { id: string; title: string; status: string }[];
  isPublished: boolean;
  isManager: boolean;
}

/** The current user's organization (owner/member view). */
export async function getOrgProfileForUser(userId: string): Promise<OrgProfileData | null> {
  const supabase = await createClient();

  // The org the user owns (onboarding creates the owner's org).
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (!org) return null;

  const [profile, locations, membersCount, invites, jobs, membership] = await Promise.all([
    supabase.from("organization_profiles").select("*").eq("org_id", org.id).maybeSingle(),
    supabase.from("organization_locations").select("*").eq("org_id", org.id).order("is_primary", { ascending: false }),
    supabase.from("organization_members").select("user_id", { count: "exact", head: true }).eq("org_id", org.id),
    supabase.from("staff_invitations").select("id, email, status").eq("org_id", org.id).eq("status", "pending"),
    supabase.from("job_posts").select("id, title, status").eq("org_id", org.id).order("created_at", { ascending: false }),
    supabase.from("organization_members").select("member_role").eq("org_id", org.id).eq("user_id", userId).maybeSingle(),
  ]);

  return {
    orgId: org.id,
    name: org.name,
    about: org.about,
    programTypes: org.program_types ?? [],
    agesServed: org.ages_served ?? [],
    size: org.size,
    multiLocation: org.multi_location,
    intents: profile.data?.intents ?? [],
    contactRoleTitle: profile.data?.contact_role_title ?? null,
    locations: locations.data ?? [],
    memberCount: membersCount.count ?? 0,
    pendingInvites: invites.data ?? [],
    jobs: jobs.data ?? [],
    isPublished: org.is_published ?? false,
    isManager: ["owner", "admin"].includes(membership.data?.member_role ?? "") || org.owner_user_id === userId,
  };
}

/** Public/visitor view of a published organization (limited fields). */
export async function getPublicOrgProfile(orgId: string): Promise<OrgProfileData | null> {
  const supabase = await createClient();
  const { data: pub } = await supabase.rpc("public_organization", { uid: orgId });
  if (!pub) return null;

  return {
    orgId: pub.orgId,
    name: pub.name,
    about: pub.about,
    programTypes: pub.programTypes ?? [],
    agesServed: pub.agesServed ?? [],
    size: pub.size,
    multiLocation: pub.multiLocation,
    intents: [],
    contactRoleTitle: null,
    locations: (pub.locations ?? []).map((l: { label: string | null; zip: string | null }, i: number) => ({
      id: String(i), label: l.label, zip_code: l.zip, is_primary: i === 0,
    })),
    memberCount: 0,
    pendingInvites: [],
    jobs: [],
    isPublished: true,
    isManager: false,
  };
}
