import Link from "next/link";
import { Logo } from "@/components/logo";
import { SignOutButton } from "./sign-out-button";

type NavItem = { href: string; label: string };

/** Authenticated app header: logo, role-specific nav, sign out. */
export function AppHeader({ nav = [], name }: { nav?: NavItem[]; name?: string }) {
  return (
    <header className="border-b border-ink/5 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" aria-label="Home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-5 sm:flex">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="text-sm font-medium text-ink-soft transition hover:text-ink">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {name && <span className="hidden text-sm text-ink-soft sm:inline">Hi, {name}</span>}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
