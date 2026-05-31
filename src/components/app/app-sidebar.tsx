"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Search, ClipboardList, Users, BookOpen, CalendarDays, MessageCircle,
  Settings, LogOut, PanelLeft, type LucideIcon,
} from "lucide-react";
import { signOut } from "@/lib/auth";

export type SidebarRole = "parent" | "caregiver" | "organization";

type Item = { label: string; href: string; icon: LucideIcon; badge?: number };

function itemsFor(role: SidebarRole): Item[] {
  const home: Item = { label: "Home", href: "/dashboard", icon: Home };
  const learn: Item = { label: "Learn", href: "/courses", icon: BookOpen };
  const events: Item = { label: "Events", href: "/events", icon: CalendarDays };
  const messages: Item = { label: "Messages", href: "/chat", icon: MessageCircle, badge: 0 };
  if (role === "caregiver") {
    return [
      home,
      { label: "Find Care Roles", href: "/jobs", icon: Search },
      { label: "My Applications", href: "/dashboard/applications", icon: ClipboardList },
      { label: "Meet Caregivers", href: "/connect", icon: Users },
      learn, events, messages,
    ];
  }
  if (role === "organization") {
    return [
      home,
      { label: "Find Staff", href: "/connect", icon: Search },
      { label: "Open Roles", href: "/organization/roles", icon: ClipboardList },
      { label: "Team Learning", href: "/courses", icon: Users },
      events, messages,
    ];
  }
  return [
    home,
    { label: "Find Care", href: "/connect", icon: Search },
    { label: "My Care Posts", href: "/dashboard/posts", icon: ClipboardList },
    { label: "Community", href: "/connect/families", icon: Users },
    learn, events, messages,
  ];
}

function setCookie(expanded: boolean) {
  document.cookie = `trc_sidebar=${expanded ? "expanded" : "collapsed"}; path=/; max-age=31536000; samesite=lax`;
}

export function AppSidebar({ role, defaultExpanded }: { role: SidebarRole; defaultExpanded: boolean }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const items = itemsFor(role);
  const active = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  // Labels show only when expanded AND on lg+; below lg it's always the "half".
  const labelCls = expanded ? "hidden lg:inline" : "hidden";
  const widthCls = expanded ? "w-[68px] lg:w-[232px]" : "w-[68px]";

  function toggle() {
    setExpanded((v) => { setCookie(!v); return !v; });
  }

  const renderRow = (item: Item) => {
    const isActive = active(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.label}
        href={item.href}
        className={`group relative mx-2 mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
          isActive ? "bg-[#f6e6a3] font-medium text-ink" : "text-ink-soft hover:bg-white/60 hover:text-ink"
        }`}
      >
        <span className="relative shrink-0">
          <Icon className="h-5 w-5" />
          {item.badge ? (
            <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#e0466e] px-1 text-[0.6rem] font-bold text-white">{item.badge}</span>
          ) : null}
        </span>
        <span className={`${labelCls} whitespace-nowrap`}>{item.label}</span>
        {/* tooltip when collapsed */}
        {!expanded && (
          <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-white opacity-0 transition group-hover:block group-hover:opacity-100">
            {item.label}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className={`${widthCls} sticky top-0 flex h-screen shrink-0 flex-col bg-[#f3ebdd] py-3 transition-[width] duration-200`}>
      {/* toggle */}
      <button onClick={toggle} aria-label={expanded ? "Collapse sidebar" : "Open sidebar"}
        className="group relative mx-2 mb-3 grid h-9 w-9 place-items-center rounded-lg bg-[#f6e6a3] text-ink transition hover:brightness-95">
        <PanelLeft className="h-4 w-4" />
        {!expanded && <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-white group-hover:block">Open sidebar</span>}
      </button>

      <nav className="flex-1 overflow-y-auto">
        {items.map((it) => renderRow(it))}
      </nav>

      <div className="mt-2">
        {renderRow({ label: "Settings", href: "/dashboard/settings", icon: Settings })}
        <button onClick={() => signOut()}
          className="group relative mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-soft transition hover:bg-white/60 hover:text-ink">
          <LogOut className="h-5 w-5 shrink-0" />
          <span className={`${labelCls} whitespace-nowrap`}>Log out</span>
          {!expanded && <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-white group-hover:block">Log out</span>}
        </button>
      </div>
    </aside>
  );
}
