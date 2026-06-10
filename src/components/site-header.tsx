"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { PublicLanguageSwitcher } from "./public-language-switcher";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("navigation");
  const locale = useLocale();

  const getLocalizedHref = (href: string) => {
    return locale === "es" ? `/es${href}` : href;
  };

  const NAV = [
    { label: t("aboutUs"), href: "/about-us" },
    { label: t("membership"), href: "/membership" },
    { label: t("training"), href: "/courses" },
    { label: t("events"), href: "/events" },
    { label: t("marketplace"), href: "/marketplace" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href={getLocalizedHref("/")} aria-label="The Raising Club home">
          <Logo />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={getLocalizedHref(item.href)}
              className="text-sm font-semibold text-ink/85 transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <PublicLanguageSwitcher />
          <Link
            href={getLocalizedHref("/sign-in")}
            className="rounded-full border border-ink/15 px-5 py-2 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
          >
            {t("signIn")}
          </Link>
          <Link
            href={getLocalizedHref("/onboarding")}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
          >
            {t("getStarted")}
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
                href={getLocalizedHref(item.href)}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm font-semibold text-ink/85 hover:bg-lavender"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex justify-center">
              <PublicLanguageSwitcher />
            </div>
            <Link
              href={getLocalizedHref("/sign-in")}
              className="rounded-full border border-ink/15 px-5 py-2.5 text-center text-sm font-semibold text-ink"
            >
              {t("signIn")}
            </Link>
            <Link
              href={getLocalizedHref("/onboarding")}
              className="rounded-full bg-primary px-5 py-2.5 text-center text-sm font-semibold text-white"
            >
              {t("getStarted")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
