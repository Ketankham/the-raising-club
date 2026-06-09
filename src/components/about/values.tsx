"use client";

import { Blocks, House, Accessibility } from "lucide-react";
import { useTranslations } from "next-intl";

const ICONS = [Blocks, House, Accessibility];

export function Values() {
  const t = useTranslations("about.values");
  const items = (t.raw("items") as { lead: string; accent: string; body: string }[]).map(
    (it, i) => ({ ...it, Icon: ICONS[i] }),
  );
  return (
    <section className="bg-cream py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <h2 className="mx-auto max-w-3xl text-center text-3xl font-extrabold text-ink sm:text-4xl lg:text-5xl">
          <span className="font-display">{t("headingLead")}</span>
          <span className="font-serif font-medium italic">{t("headingAccent")}</span>
        </h2>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {items.map(({ Icon, lead, accent, body }) => (
            <div
              key={accent}
              className="rounded-3xl border border-black/5 bg-white p-9 text-center shadow-sm"
            >
              <Icon size={34} strokeWidth={1.5} className="mx-auto text-ink" />
              <h3 className="mt-5 text-xl text-ink">
                <span className="font-display font-bold">{lead} </span>
                <span className="font-serif font-medium italic">{accent}</span>
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink/70">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
