import type { ReactNode } from "react";
import { requireUserProfile } from "@/lib/guards";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Chrome for the whole /admin area (sidebar + top bar). Page-level guards
 * (requireAdmin / requireEventManager) still enforce access per route — this
 * layout only requires a signed-in profile and tailors the sidebar to role.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireUserProfile();
  const name = profile.preferred_name || profile.first_name || "there";
  const initials =
    `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase() ||
    name.slice(0, 2).toUpperCase();
  const isAdmin = profile.role === "admin";

  return (
    <AdminShell name={name} initials={initials} isAdmin={isAdmin}>
      {children}
    </AdminShell>
  );
}
