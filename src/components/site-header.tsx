"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";

const NAV = [
  { label: "About Us", href: "/about-us" },
  { label: "Membership", href: "/membership" },
  { label: "Training", href: "/courses" },
  { label: "Events", href: "/events" },
  { label: "Contact", href: "/#footer" },
  { label: "Marketplace", href: "/marketplace" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" aria-label="The Raising Club home">
          <Logo />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-semibold text-ink/85 transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/sign-in"
            className="rounded-full border border-ink/15 px-5 py-2 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
          >
            Sign in
          </Link>
          <Link
            href="/onboarding"
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-lg text-ink lg:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-black/5 bg-white px-5 pb-6 pt-2 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm font-semibold text-ink/85 hover:bg-lavender"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <Link
              href="/sign-in"
              className="rounded-full border border-ink/15 px-5 py-2.5 text-center text-sm font-semibold text-ink"
            >
              Sign in
            </Link>
            <Link
              href="/onboarding"
              className="rounded-full bg-primary px-5 py-2.5 text-center text-sm font-semibold text-white"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
