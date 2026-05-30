import { createClient } from "@/lib/supabase/server";

export interface TeamMember { userId: string; name: string | null; email: string | null; role: string; status: string }
export interface PendingInvite { id: string; email: string; status: string; token: string; createdAt: string }

export interface TeamData {
  orgId: string;
  orgName: string;
  members: TeamMember[];
  invites: PendingInvite[];
}

/** Team (members + pending invites) for the org owned by the current user. */
export async function getTeamData(userId: string): Promise<TeamData | null> {
  const supabase = await createClient();
  const { data: org } = await supabase.from("organizations").select("id, name").eq("owner_user_id", userId).maybeSingle();
  if (!org) return null;

  const [{ data: members }, { data: invites }] = await Promise.all([
    supabase.rpc("org_members_list", { target_org: org.id }),
    supabase.from("staff_invitations").select("id, email, status, token, created_at").eq("org_id", org.id).eq("status", "pending").order("created_at", { ascending: false }),
  ]);

  return {
    orgId: org.id,
    orgName: org.name,
    members: (members ?? []) as TeamMember[],
    invites: (invites ?? []).map((i) => ({ id: i.id, email: i.email, status: i.status, token: i.token, createdAt: i.created_at })),
  };
}
