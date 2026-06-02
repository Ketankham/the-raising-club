import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { requireOnboardedForMarketplace } from "@/lib/guards";
import { DashboardShell, type Role } from "@/components/dashboard/dashboard-shell";

/** Marketplace browse surfaces (/connect, /connect/families) share the
 *  dashboard shell (sidebar + top nav) to match the Figma marketplace chrome. */
export default async function ConnectLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireOnboardedForMarketplace();
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
