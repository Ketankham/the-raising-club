"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

export function PublicLanguageSwitcher() {
  const pathname = usePathname();
  const locale = useLocale();

  const handleSwitch = (newLocale: "en" | "es") => {
    if (newLocale === locale) return;

    // Set the NEXT_LOCALE cookie so next-intl doesn't redirect back
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;

    if (newLocale === "en") {
      // Remove /es from current URL — same page, English
      window.location.href = pathname.replace(/^\/es/, "") || "/";
    } else {
      // Add /es to current URL — same page, Spanish
      window.location.href = `/es${pathname}`;
    }
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
