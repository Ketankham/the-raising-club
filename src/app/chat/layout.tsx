import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { requireOnboardedProfile } from "@/lib/guards";
import { DashboardShell, type Role } from "@/components/dashboard/dashboard-shell";

/** Chat shares the dashboard shell (sidebar + top nav). */
export default async function ChatLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireOnboardedProfile();
  if (profile.role === "admin") redirect("/admin");

  const role = profile.role as Role;
  const name = profile.preferred_name || profile.first_name || "there";
  const initials = ((profile.preferred_name || profile.first_name || "?")[0] + (profile.last_name?.[0] ?? "")).toUpperCase();

  return (
    <DashboardShell role={role} name={name} email={profile.email} initials={initials}>
      {children}
    </DashboardShell>
  );
}
