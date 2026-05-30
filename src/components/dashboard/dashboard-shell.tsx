"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BookOpen, GraduationCap, Briefcase, Search, Users,
  FileText, MessageCircle, Calendar, User, Bell, Menu, X, Settings,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/app/sign-out-button";

export type Role = "parent" | "caregiver" | "organization";

type NavItem = { label: string; href: string; icon: typeof LayoutDashboard };

/** Sidebar items. Nearly identical for all roles; a few are role-tailored. */
function navFor(role: Role, profileHref: string): NavItem[] {
  const common: NavItem[] = [
    { label: "Dashboard Home", href: "/dashboard", icon: LayoutDashboard },
    { label: "Browse Courses", href: "/courses", icon: BookOpen },
    { label: "My Courses", href: "/dashboard/courses", icon: GraduationCap },
  ];
  const roleItems: NavItem[] =
    role === "caregiver"
      ? [
          { label: "Find Jobs", href: "/jobs", icon: Briefcase },
          { label: "My Applications", href: "/dashboard/applications", icon: FileText },
          { label: "Connect", href: "/connect", icon: Users },
        ]
      : role === "organization"
        ? [
            { label: "Find Caregivers", href: "/connect", icon: Search },
            { label: "My Roles", href: "/organization/roles", icon: Briefcase },
            { label: "Team", href: "/organization/team", icon: Users },
          ]
        : [
            { label: "Find Caregivers", href: "/connect", icon: Search },
            { label: "Connect Families", href: "/connect/families", icon: Users },
          ];
  const tail: NavItem[] = [
    { label: "Chat", href: "/chat", icon: MessageCircle },
    { label: "Events", href: "/events", icon: Calendar },
    { label: "My Profile", href: profileHref, icon: User },
  ];
  return [...common, ...roleItems, ...tail];
}

const TOP_NAV = [
  { label: "About Us", href: "/about-us" },
  { label: "Membership", href: "/membership" },
  { label: "Training", href: "/courses" },
  { label: "Events", href: "/events" },
  { label: "Contact", href: "/#footer" },
];

const ROLE_TAG: Record<Role, string> = { parent: "Families", caregiver: "Caregiver", organization: "Program" };

export function DashboardShell({
  role, name, email, initials, children,
}: {
  role: Role;
  name: string;
  email: string | null;
  initials: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const profileHref = role === "caregiver" ? "/profile" : role === "organization" ? "/organization" : "/dashboard";
  const nav = navFor(role, profileHref);
  const isActive = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  const Sidebar = (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-ink/8 bg-white">
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {nav.map((n) => {
          const active = isActive(n.href);
          return (
            <Link
              key={n.label}
              href={n.href}
              onClick={() => setOpen(false)}
              className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-primary/10 text-primary" : "text-ink-soft hover:bg-cream hover:text-ink"
              }`}
            >
              <n.icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-ink/8 px-3 py-4">
        <div className="mb-3 flex items-center gap-3 px-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">{initials}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{name}</p>
            <span className="rounded-full bg-lavender px-2 py-0.5 text-[0.65rem] font-medium text-purple">{ROLE_TAG[role]}</span>
          </div>
        </div>
        <Link href={profileHref} className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-soft hover:bg-cream hover:text-ink"><Settings className="h-4 w-4" /> Settings</Link>
        <div className="px-3 py-2"><SignOutButton /></div>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      {/* TOP BAR */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-ink/8 bg-white px-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setOpen((v) => !v)} className="grid h-10 w-10 place-items-center rounded-lg text-ink lg:hidden" aria-label="Menu">{open ? <X size={22} /> : <Menu size={22} />}</button>
          <Link href="/dashboard"><Logo /></Link>
        </div>
        <nav className="hidden items-center gap-6 lg:flex">
          {TOP_NAV.map((n) => <Link key={n.label} href={n.href} className="text-sm font-medium text-ink-soft transition hover:text-ink">{n.label}</Link>)}
        </nav>
        <div className="flex items-center gap-3">
          <button className="relative grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-cream" aria-label="Notifications"><Bell className="h-5 w-5" /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" /></button>
          <span className="hidden text-right sm:block"><span className="block max-w-[160px] truncate text-xs text-ink-soft">{email}</span></span>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">{initials}</span>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">{Sidebar}</div>
        {/* Mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-ink/30" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-0 h-full">{Sidebar}</div>
          </div>
        )}
        <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
