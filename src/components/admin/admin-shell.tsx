"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, LogOut, Menu, Users, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { signOut } from "@/lib/auth";

type Item = { label: string; href: string; icon: typeof Users };

/** Sidebar + top-bar shell for the admin/management area (Users, Events). */
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
  items.push({ label: "Events", href: "/admin/events", icon: Calendar });

  const active = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const sidebar = (
    <div className="flex h-full w-[164px] flex-col rounded-2xl bg-[#f3ebdd] p-3">
      <p className="mb-2 px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink-soft">Admin</p>
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
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-[#faf5ee] px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-lg text-ink lg:hidden"
            aria-label="Menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Link href="/admin/events" aria-label="Home">
            <Logo />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-ink-soft sm:inline">Hi, {name}</span>
          <span
            className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary"
            aria-hidden
          >
            {initials}
          </span>
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
