"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

export function PublicLanguageSwitcher() {
  const pathname = usePathname();
  const locale = useLocale();

  const handleSwitch = (newLocale: "en" | "es") => {
    if (newLocale === locale) return;

    // Strip any /es prefix to get the base path
    let basePath = pathname;
    if (pathname.startsWith("/es/")) {
      basePath = pathname.slice(3); // keeps the leading /
    } else if (pathname === "/es") {
      basePath = "/";
    }

    // Build the new URL
    const newPath = newLocale === "es" ? `/es${basePath}` : basePath;

    // Hard navigate so next-intl re-detects the locale from the URL
    window.location.href = newPath;
  };

  return (
    <div className="flex gap-2 rounded-lg bg-black/5 p-1">
      <button
        onClick={() => handleSwitch("en")}
        className={`rounded px-3 py-1.5 text-xs font-medium transition ${
          locale === "en"
            ? "bg-white text-ink shadow-sm"
            : "text-ink/60 hover:text-ink"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => handleSwitch("es")}
        className={`rounded px-3 py-1.5 text-xs font-medium transition ${
          locale === "es"
            ? "bg-white text-ink shadow-sm"
            : "text-ink/60 hover:text-ink"
        }`}
      >
        ES
      </button>
    </div>
  );
}
