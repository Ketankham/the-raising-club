import { createClient } from "@/lib/supabase/server";

export interface AdminUserRow {
  id: string;
  email: string | null;
  role: string | null;
  name: string;
  onboardingCompleted: boolean;
  onboardingStatus: string | null;
  emailConfirmed: boolean;
  registeredAt: string | null;
  createdAt: string;
  deactivated: boolean;
}

export interface AdminInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  token: string;
  createdAt: string;
  expiresAt: string;
}

/** All platform users (admin RLS allows reading every profile). */
export async function listUsers(): Promise<AdminUserRow[]> {
  const supabase = await createClient();
  const [{ data: profiles }, { data: progress }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("onboarding_progress").select("user_id, status"),
  ]);

  const statusByUser = new Map((progress ?? []).map((p) => [p.user_id, p.status]));

  return (profiles ?? []).map((p) => ({
    id: p.id,
    email: p.email,
    role: p.role,
    name: p.preferred_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || "—",
    onboardingCompleted: !!p.onboarding_completed_at,
    onboardingStatus: statusByUser.get(p.id) ?? null,
    emailConfirmed: !!p.email_confirmed_at,
    registeredAt: p.registered_at,
    createdAt: p.created_at,
    deactivated: !!p.deactivated_at,
  }));
}

export async function listInvitations(): Promise<AdminInvitation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_invitations")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map((i) => ({
    id: i.id,
    email: i.email,
    role: i.role,
    status: i.status,
    token: i.token,
    createdAt: i.created_at,
    expiresAt: i.expires_at,
  }));
}

export interface AdminUserDetail {
  id: string;
  role: string | null;
  firstName: string | null;
  lastName: string | null;
  preferredName: string | null;
  email: string | null;
  phone: string | null;
  zip: string | null;
  registeredAt: string | null;
  createdAt: string;
  emailConfirmed: boolean;
  onboardingCompleted: boolean;
  deactivated: boolean;
  planKey: string | null;
  planInterval: "monthly" | "annual";
  parent: { childTerm: string | null; intents: string[] } | null;
  organization: { name: string; about: string | null } | null;
}

/**
 * Full detail for a single user, for the admin user-detail page. Admin RLS
 * (`profiles_admin_all`, and the per-table admin select policies) lets an admin
 * read any profile and role record, so no SECURITY DEFINER RPC is needed.
 */
export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
  const supabase = await createClient();
  const { data: p } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (!p) return null;

  let parent: AdminUserDetail["parent"] = null;
  let organization: AdminUserDetail["organization"] = null;

  if (p.role === "parent") {
    const { data } = await supabase
      .from("parent_profiles")
      .select("child_term, intents")
      .eq("user_id", userId)
      .maybeSingle();
    parent = { childTerm: data?.child_term ?? null, intents: data?.intents ?? [] };
  } else if (p.role === "organization") {
    const { data } = await supabase
      .from("organizations")
      .select("name, about")
      .eq("owner_user_id", userId)
      .maybeSingle();
    organization = data ? { name: data.name, about: data.about } : null;
  }

  return {
    id: p.id,
    role: p.role,
    firstName: p.first_name,
    lastName: p.last_name,
    preferredName: p.preferred_name,
    email: p.email,
    phone: p.phone,
    zip: p.zip_code,
    registeredAt: p.registered_at,
    createdAt: p.created_at,
    emailConfirmed: !!p.email_confirmed_at,
    onboardingCompleted: !!p.onboarding_completed_at,
    deactivated: !!p.deactivated_at,
    planKey: p.plan_key ?? null,
    planInterval: (p.plan_interval as "monthly" | "annual") ?? "monthly",
    parent,
    organization,
  };
}

export function summarize(users: AdminUserRow[]) {
  const byRole: Record<string, number> = {};
  let active = 0;
  let onboarded = 0;
  for (const u of users) {
    byRole[u.role ?? "unset"] = (byRole[u.role ?? "unset"] ?? 0) + 1;
    if (!u.deactivated) active++;
    if (u.onboardingCompleted) onboarded++;
  }
  return { total: users.length, active, onboarded, byRole };
}
