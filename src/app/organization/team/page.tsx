import { redirect } from "next/navigation";
import { requireUserProfile } from "@/lib/guards";
import { getTeamData } from "@/lib/org-team";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TeamManager } from "@/components/organization/team-manager";

export default async function TeamPage() {
  const { user, profile } = await requireUserProfile();
  if (profile.role !== "organization") redirect("/dashboard");

  const team = await getTeamData(user.id);
  if (!team) redirect("/onboarding");

  const name = profile.preferred_name || profile.first_name || "there";
  const initials = ((profile.preferred_name || profile.first_name || "?")[0] + (profile.last_name?.[0] ?? "")).toUpperCase();

  return (
    <DashboardShell role="organization" name={name} email={profile.email} initials={initials}>
      <TeamManager team={team} />
    </DashboardShell>
  );
}
