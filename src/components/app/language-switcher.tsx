"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { updateLocale } from "@/lib/settings/actions";

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("languageSwitcher");
  const [isLoading, setIsLoading] = useState(false);

  const handleSwitch = async (newLocale: "en" | "es") => {
    if (newLocale === locale || isLoading) return;

    setIsLoading(true);
    try {
      // Update the user's profile preference
      await updateLocale(newLocale);

      // Strip current locale prefix from pathname, then add new one if Spanish
      let newPath = pathname;
      if (pathname.startsWith("/es")) {
        newPath = pathname.slice(3) || "/";
      }

      if (newLocale === "es") {
        newPath = `/es${newPath}`;
      }

      router.push(newPath);
    } finally {
      setIsLoading(false);
    }
  };

  const locales: Array<{ code: "en" | "es"; label: string }> = [
    { code: "en", label: t("en") },
    { code: "es", label: t("es") },
  ];

  return (
    <div className="flex gap-1 rounded-lg bg-white/30 p-1">
      {locales.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => handleSwitch(code)}
          disabled={isLoading}
          className={`rounded px-2.5 py-1.5 text-xs font-medium transition ${
            locale === code
              ? "bg-[#f6e6a3] text-ink shadow-sm"
              : "text-ink-soft hover:text-ink disabled:opacity-50"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
