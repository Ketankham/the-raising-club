import { redirect } from "next/navigation";
import { requireUserProfile } from "@/lib/guards";
import { DashboardShell, type Role } from "@/components/dashboard/dashboard-shell";
import { DashboardHome } from "@/components/dashboard/dashboard-home";

/**
 * Logged-in dashboard shell (sidebar + top bar), shared across non-admin roles.
 * Onboarding is NOT required here ("register first, onboard later") — a user who
 * registered for an event but hasn't onboarded lands here and is nudged by the
 * site-wide onboarding banner instead of being force-redirected into onboarding.
 */
export default async function DashboardPage() {
  const { supabase, user, profile } = await requireUserProfile();
  if (profile.role === "admin") redirect("/admin");

  const role = profile.role as Role;
  const name = profile.preferred_name || profile.first_name || "there";
  const initials = ((profile.preferred_name || profile.first_name || "?")[0] + (profile.last_name?.[0] ?? "")).toUpperCase();

  // Unread count for the header bell (RLS scopes it to this user).
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  return (
    <DashboardShell role={role} name={name} email={profile.email} initials={initials} unreadCount={count ?? 0}>
      <DashboardHome
        role={role}
        userId={user.id}
        name={name}
        showTour={!profile.dashboard_tour_completed_at}
      />
    </DashboardShell>
  );
}
