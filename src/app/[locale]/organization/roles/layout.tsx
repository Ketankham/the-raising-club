import type { ReactNode } from "react";

/**
 * Chrome for the org owner's role-management pages (Open Roles, post/edit a
 * role, applicants). Adds the standard content gutters + a comfortable max
 * width so cards don't sit flush against the sidebar or bleed to the right
 * edge — mirrors the padding used in /manage for org owners.
 */
export default function OrgRolesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 pb-12 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}
