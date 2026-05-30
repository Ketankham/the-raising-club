import { redirect } from "next/navigation";
import { requireOnboardedProfile } from "@/lib/guards";
import { DashboardShell, type Role } from "@/components/dashboard/dashboard-shell";
import { DashboardHome } from "@/components/dashboard/dashboard-home";

/** Logged-in dashboard shell (sidebar + top bar), shared across non-admin roles. */
export default async function DashboardPage() {
  const { user, profile } = await requireOnboardedProfile();
  if (profile.role === "admin") redirect("/admin");

  const role = profile.role as Role;
  const name = profile.preferred_name || profile.first_name || "there";
  const initials = ((profile.preferred_name || profile.first_name || "?")[0] + (profile.last_name?.[0] ?? "")).toUpperCase();

  return (
    <DashboardShell role={role} name={name} email={profile.email} initials={initials}>
      <DashboardHome role={role} userId={user.id} name={name} />
    </DashboardShell>
  );
}
