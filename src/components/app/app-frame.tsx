"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar, type SidebarRole } from "./app-sidebar";

// Routes that manage their own chrome (no global sidebar).
const NO_SIDEBAR = ["/onboarding", "/sign-in", "/review", "/deactivated", "/admin", "/auth"];

const SIDEBAR_ROLES: SidebarRole[] = ["parent", "caregiver", "organization"];

/**
 * Global app frame. For logged-in parent/caregiver/organization users it pins
 * the collapsible sidebar to the left on every page (public + in-app); guests,
 * admins, and auth/onboarding flows render without it.
 */
export function AppFrame({
  role, expanded, children,
}: {
  role: string | null;
  expanded: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const show =
    !!role &&
    (SIDEBAR_ROLES as string[]).includes(role) &&
    !NO_SIDEBAR.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!show) return <>{children}</>;

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar role={role as SidebarRole} defaultExpanded={expanded} />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
