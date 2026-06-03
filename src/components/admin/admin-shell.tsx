"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, Bell, BookOpen, Briefcase, Calendar, CreditCard, LogOut, Menu, Tag, Users, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { signOut } from "@/lib/auth";

type Item = { label: string; href: string; icon: typeof Users };

/** Sidebar + top-bar shell for the admin/management area (Users, Events, Courses).
 *  The sidebar is a fixed, full-height rail pinned to the left edge on desktop,
 *  and a slide-in drawer on mobile. */
export function AdminShell({
  name,
  initials,
  isAdmin,
  children,
}: {
  name: string;
  initials: string;
  isAdmin: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items: Item[] = [];
  if (isAdmin) items.push({ label: "Users", href: "/admin", icon: Users });
  items.push({ label: "Events", href: "/manage/events", icon: Calendar });
  if (isAdmin) items.push({ label: "Courses", href: "/admin/courses", icon: BookOpen });
  if (isAdmin) items.push({ label: "Plans", href: "/admin/plans", icon: Tag });
  if (isAdmin) items.push({ label: "Marketplace", href: "/admin/marketplace", icon: Briefcase });
  if (isAdmin) items.push({ label: "Error Logs", href: "/admin/errors", icon: AlertTriangle });
  if (isAdmin) items.push({ label: "Notifications", href: "/admin/notifications", icon: Bell });
  if (isAdmin) items.push({ label: "Payments", href: "/admin/settings/payments", icon: CreditCard });

  const active = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const SidebarBody = (
    <div className="flex h-full flex-col bg-[#f3ebdd] p-4">
      <Link href="/manage/events" aria-label="Home" className="mb-6 inline-block px-1" onClick={() => setOpen(false)}>
        <Logo />
      </Link>
      <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wide text-ink-soft">Admin</p>
      <nav className="flex-1">
        {items.map((it) => (
          <Link
            key={it.label}
            href={it.href}
            onClick={() => setOpen(false)}
            className={`mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
              active(it.href)
                ? "bg-white font-medium text-ink shadow-sm"
                : "text-ink-soft hover:bg-white/50"
            }`}
          >
            <it.icon className="h-4 w-4" /> {it.label}
          </Link>
        ))}
      </nav>
      <div className="mt-2 border-t border-ink/10 pt-2">
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-white/50"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf5ee]">
      {/* Fixed full-height rail (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-ink/10 lg:block">
        {SidebarBody}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-60 shadow-xl">{SidebarBody}</div>
        </div>
      )}

      {/* Content column, offset by the rail width on desktop */}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ink/10 bg-[#faf5ee]/95 px-4 backdrop-blur sm:px-6">
          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-lg text-ink lg:hidden"
            aria-label="Menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="flex flex-1 items-center justify-end gap-3">
            <span className="hidden text-sm text-ink-soft sm:inline">Hi, {name}</span>
            <span
              className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary"
              aria-hidden
            >
              {initials}
            </span>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6 pb-12 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
