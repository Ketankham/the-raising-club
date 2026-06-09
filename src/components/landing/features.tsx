"use client";

import { useTranslations } from "next-intl";
import {
  ShieldCheck,
  Sparkles,
  Users,
  GraduationCap,
  Building2,
  LifeBuoy,
} from "lucide-react";

const FEATURES_CONFIG = [
  { Icon: ShieldCheck, color: "bg-olive/30", key: "1" },
  { Icon: Sparkles, color: "bg-purple/30", key: "2" },
  { Icon: Users, color: "bg-pink", key: "3" },
  { Icon: GraduationCap, color: "bg-yellow/40", key: "4" },
  { Icon: Building2, color: "bg-primary-soft/30", key: "5" },
  { Icon: LifeBuoy, color: "bg-mint", key: "6" },
];

export function Features() {
  const t = useTranslations("landing.features");

  return (
    <section id="features" className="bg-cream py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-extrabold text-ink sm:text-4xl lg:text-5xl">
            {t("sectionTitle")}
          </h2>
          <p className="mt-5 text-lg text-ink/75">
            {t("sectionDesc")}
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES_CONFIG.map(({ Icon, color, key }) => (
            <div
              key={key}
              className="rounded-3xl border border-black/5 bg-white p-7 shadow-sm transition-transform hover:-translate-y-1"
            >
              <span className={`inline-grid h-12 w-12 place-items-center rounded-2xl ${color}`}>
                <Icon size={22} className="text-ink" />
              </span>
              <h3 className="mt-5 font-display text-lg font-bold text-ink">
                {t(`feature${key}Title`)}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink/70">
                {t(`feature${key}Body`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
