"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Logo } from "@/components/logo";
import { NotificationBell } from "@/components/notifications/notification-bell";

export type Role = "parent" | "caregiver" | "organization";

const TOP_NAV = [
  { label: "Dashboard home", href: "/dashboard" },
  { label: "Browse courses", href: "/courses" },
  { label: "My courses", href: "/dashboard/courses" },
  { label: "Find jobs", href: "/jobs" },
  { label: "Membership", href: "/membership" },
];

/**
 * Dashboard top bar + content. The left navigation is now the global AppSidebar
 * (rendered by the root layout), so this only provides the top bar.
 */
export function DashboardShell({
  email, initials, unreadCount = 0, children,
}: {
  role: Role;
  name: string;
  email: string | null;
  initials: string;
  unreadCount?: number;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#faf5ee]">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-[#faf5ee] px-4 sm:px-6">
        <Link href="/dashboard"><Logo /></Link>
        <nav className="hidden items-center gap-2 md:flex">
          {TOP_NAV.map((n) => {
            const isActive = pathname === n.href;
            return (
              <Link key={n.label} href={n.href} className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${isActive ? "bg-ink text-white" : "text-ink-soft hover:text-ink"}`}>{n.label}</Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <button className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-white" aria-label="Search"><Search className="h-5 w-5" /></button>
          <NotificationBell initialUnread={unreadCount} variant="header" />
          <span title={email ?? ""} className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">{initials}</span>
        </div>
      </header>

      <main className="min-w-0 px-4 pb-10 pt-2 sm:px-6">{children}</main>
    </div>
  );
}
