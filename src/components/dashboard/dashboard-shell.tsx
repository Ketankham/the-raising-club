"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid, Search, FileText, Users, BookOpen, Calendar, MessageCircle,
  Settings, Bell, Menu, X, PanelLeft, Briefcase,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { signOut } from "@/lib/auth";

export type Role = "parent" | "caregiver" | "organization";

type Item = { label: string; href: string; icon: typeof LayoutGrid };

function sidebarFor(role: Role, profileHref: string): Item[] {
  const find: Item =
    role === "caregiver" ? { label: "Find Jobs", href: "/jobs", icon: Briefcase }
    : role === "organization" ? { label: "Find Care", href: "/connect", icon: Search }
    : { label: "Find Care", href: "/connect", icon: Search };
  const mine: Item =
    role === "caregiver" ? { label: "My Applications", href: "/dashboard/applications", icon: FileText }
    : role === "organization" ? { label: "My Roles", href: "/organization/roles", icon: FileText }
    : { label: "My Care Posts", href: "/dashboard/posts", icon: FileText };
  return [
    { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    find,
    mine,
    { label: "Community", href: "/connect/families", icon: Users },
    { label: "Learn", href: "/courses", icon: BookOpen },
    { label: "Events", href: "/events", icon: Calendar },
    { label: "Messages", href: "/chat", icon: MessageCircle },
  ];
}

const TOP_NAV = [
  { label: "Dashboard home", href: "/dashboard" },
  { label: "Browse courses", href: "/courses" },
  { label: "My courses", href: "/dashboard/courses" },
  { label: "Find jobs", href: "/jobs" },
  { label: "Membership", href: "/membership" },
];

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
  const items = sidebarFor(role, profileHref);
  const active = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  const sidebar = (
    <div className="flex h-full w-[164px] flex-col rounded-2xl bg-[#f3ebdd] p-3">
      <button className="mb-2 grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-white/60" aria-label="Collapse"><PanelLeft className="h-4 w-4" /></button>
      <nav className="flex-1">
        {items.map((it) => (
          <Link key={it.label} href={it.href} onClick={() => setOpen(false)}
            className={`mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${active(it.href) ? "bg-white font-medium text-ink shadow-sm" : "text-ink-soft hover:bg-white/50"}`}>
            <it.icon className="h-4 w-4" /> {it.label}
          </Link>
        ))}
      </nav>
      <div className="mt-2 border-t border-ink/10 pt-2">
        <Link href={profileHref} className="mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-white/50"><Settings className="h-4 w-4" /> Settings</Link>
        <button onClick={() => signOut()} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-white/50"><X className="h-4 w-4" /> Log out</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf5ee]">
      {/* TOP BAR */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-[#faf5ee] px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setOpen((v) => !v)} className="grid h-10 w-10 place-items-center rounded-lg text-ink lg:hidden" aria-label="Menu">{open ? <X size={22} /> : <Menu size={22} />}</button>
          <Link href="/dashboard"><Logo /></Link>
        </div>
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
          <button className="relative grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-white" aria-label="Notifications"><Bell className="h-5 w-5" /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" /></button>
          <span title={email ?? ""} className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">{initials}</span>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-5 px-4 pb-10 sm:px-6">
        <div className="hidden lg:block">{sidebar}</div>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-ink/30" onClick={() => setOpen(false)} />
            <div className="absolute left-3 top-3 h-[calc(100%-1.5rem)]">{sidebar}</div>
          </div>
        )}
        <main className="min-w-0 flex-1 py-2">{children}</main>
      </div>
    </div>
  );
}
