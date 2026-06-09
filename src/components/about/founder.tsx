"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { StarBurst } from "@/components/about/star-burst";

export function Founder() {
  const t = useTranslations("about.founder");
  return (
    <section id="founder" className="bg-lavender/50 py-20 lg:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <div className="relative mx-auto w-full max-w-sm">
          <StarBurst className="absolute -left-7 -top-7 z-10 h-20 w-20 text-yellow" />
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[2rem] shadow-lg">
            <Image
              src="/images/ara.png"
              alt="Ara V., Founder & Montessori Educator"
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover"
            />
          </div>
        </div>

        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-primary">
            {t("eyebrow")}
          </p>
          <h2 className="mt-3 font-serif text-4xl font-bold text-ink sm:text-5xl">
            {t("name")}
          </h2>
          <p className="mt-1 font-display text-sm font-semibold text-ink/70">
            {t("role")}
          </p>

          <div className="mt-6 space-y-4 text-ink/75">
            <p>{t("p1")}</p>
            <p>{t("p2")}</p>
            <p>{t("p3")}</p>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/get-started"
              className="rounded-full bg-yellow px-8 py-3.5 text-sm font-semibold text-ink shadow-sm transition-[filter] hover:brightness-95"
            >
              {t("joinCta")}
            </Link>
            <Link
              href="/manifesto"
              className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-white px-7 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
            >
              {t("manifestoCta")} <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
