import { createClient } from "@/lib/supabase/server";
import { findHousehold } from "./server";

export type HouseholdMember = {
  userId: string;
  name: string | null;
  email: string | null;
  role: "owner" | "adult";
  relationLabel: string | null;
  status: string;
};

export type HouseholdInvite = {
  id: string;
  email: string;
  relationLabel: string | null;
  token: string;
  status: string;
  expiresAt: string;
};

export type SeatUsage = { limit: number; used: number; pending: number; available: number };

export type HouseholdView = {
  id: string;
  name: string | null;
  isOwner: boolean;
  members: HouseholdMember[];
  invites: HouseholdInvite[];
  seats: SeatUsage;
};

/** The current user's household with members, pending invites, and seat usage. */
export async function getMyHousehold(): Promise<HouseholdView | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const householdId = await findHousehold(supabase, user.id);
  if (!householdId) return null;

  const { data: hh } = await supabase.from("households").select("id, name, owner_user_id").eq("id", householdId).maybeSingle();
  if (!hh) return null;

  const [{ data: membersJson }, { data: seatsJson }, { data: invites }] = await Promise.all([
    supabase.rpc("household_members_list", { target: householdId }),
    supabase.rpc("household_seat_usage", { target: householdId }),
    supabase
      .from("household_invitations")
      .select("id, email, relation_label, token, status, expires_at")
      .eq("household_id", householdId)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  const members: HouseholdMember[] = (membersJson as RawMember[] | null ?? []).map((m) => ({
    userId: m.userId,
    name: m.name,
    email: m.email,
    role: m.role,
    relationLabel: m.relationLabel,
    status: m.status,
  }));

  const seats = (seatsJson as SeatUsage | null) ?? { limit: 1, used: members.length, pending: 0, available: 0 };

  return {
    id: hh.id,
    name: hh.name,
    isOwner: hh.owner_user_id === user.id,
    members,
    invites: (invites ?? []).map((i: RawInvite) => ({
      id: i.id,
      email: i.email,
      relationLabel: i.relation_label,
      token: i.token,
      status: i.status,
      expiresAt: i.expires_at,
    })),
    seats,
  };
}

type RawMember = {
  userId: string;
  name: string | null;
  email: string | null;
  role: "owner" | "adult";
  relationLabel: string | null;
  status: string;
};
type RawInvite = { id: string; email: string; relation_label: string | null; token: string; status: string; expires_at: string };
