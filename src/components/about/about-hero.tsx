"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function AboutHero() {
  const t = useTranslations("about.hero");
  return (
    <section className="bg-cream">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 lg:grid-cols-2 lg:px-8 lg:py-20">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-primary">
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 text-4xl leading-[1.18] sm:text-5xl">
            <span className="font-display font-extrabold text-ink">{t("titleLead")}</span>
            <span className="rounded-[0.45em] bg-[#cfe2e6] px-2 py-0.5 font-serif font-medium text-ink [box-decoration-break:clone]">
              {t("titleHighlight")}
            </span>
            <span className="font-serif font-medium text-ink">{t("titleTail")}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink/75">{t("description")}</p>
          <div className="mt-9">
            <Link
              href="/get-started"
              className="inline-flex rounded-full bg-yellow px-8 py-3.5 text-sm font-semibold text-ink shadow-sm transition-[filter] hover:brightness-95"
            >
              {t("cta")}
            </Link>
          </div>
        </div>

        {/* decorative shapes are baked into the asset */}
        <div className="relative mx-auto w-full max-w-xl">
          <Image
            src="/images/about-hero-family.png"
            alt="A family embracing together outdoors"
            width={2643}
            height={1756}
            priority
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}
