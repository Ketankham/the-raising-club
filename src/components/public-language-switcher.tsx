"use client";

import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

export function PublicLanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const handleSwitch = (newLocale: "en" | "es") => {
    if (newLocale === locale) return;

    // Remove /es prefix if present to get the base path
    let newPath = pathname;
    if (pathname.startsWith("/es")) {
      newPath = pathname.slice(3) || "/";
    }

    // Add /es prefix if switching to Spanish
    if (newLocale === "es") {
      newPath = `/es${newPath}`;
    }

    router.push(newPath);
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
