import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { requireOnboardedForMarketplace } from "@/lib/guards";
import { DashboardShell, type Role } from "@/components/dashboard/dashboard-shell";

/** My Care Posts (job posting) shares the dashboard shell. Caregivers don't
 *  post jobs — they're redirected to Find Jobs. */
export default async function PostsLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireOnboardedForMarketplace();
  if (profile.role === "admin") redirect("/admin");
  if (profile.role === "caregiver") redirect("/jobs");

  const role = profile.role as Role;
  const name = profile.preferred_name || profile.first_name || "there";
  const initials = ((profile.preferred_name || profile.first_name || "?")[0] + (profile.last_name?.[0] ?? "")).toUpperCase();

  return (
    <DashboardShell role={role} name={name} email={profile.email} initials={initials}>
      {children}
    </DashboardShell>
  );
}
