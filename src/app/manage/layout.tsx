import type { ReactNode } from "react";
import { requireEventManager } from "@/lib/guards";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Chrome for the shared event-management area (/manage/*). Platform **admins**
 * get the dedicated AdminShell console; **org owners** (event managers) render
 * inside the global app chrome (the left AppSidebar from the root layout) so
 * managing events feels consistent with the rest of their experience, not like
 * an admin tool. `requireEventManager` gates access (admins + org owners only).
 */
export default async function ManageLayout({ children }: { children: ReactNode }) {
  const { profile, isAdmin } = await requireEventManager();

  if (!isAdmin) {
    return <div className="px-4 py-6 pb-12 sm:px-6 lg:px-8">{children}</div>;
  }

  const name = profile.preferred_name || profile.first_name || "there";
  const initials =
    `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase() ||
    name.slice(0, 2).toUpperCase();

  return (
    <AdminShell name={name} initials={initials} isAdmin>
      {children}
    </AdminShell>
  );
}
