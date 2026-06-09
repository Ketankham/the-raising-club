"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

function Paragraph({ lead, rest }: { lead: string; rest: string }) {
  return (
    <p className="text-base leading-relaxed text-ink/80">
      {lead && <span className="font-bold text-ink">{lead}</span>}
      {rest}
    </p>
  );
}

export function Manifesto() {
  const t = useTranslations("about.manifesto");

  return (
    <>
      {/* Hero */}
      <section className="bg-cream">
        <div className="mx-auto max-w-7xl px-5 pt-8 lg:px-8">
          <Link
            href="/about-us"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 transition-colors hover:text-primary"
          >
            <ArrowLeft size={16} /> {t("backToAbout")}
          </Link>
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-14 pt-6 lg:grid-cols-2 lg:px-8 lg:pb-20">
          <div>
            <span className="inline-block rounded-full border border-ink/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-ink/70">
              {t("label")}
            </span>
            <h1 className="mt-6 text-4xl leading-[1.18] sm:text-5xl">
              <span className="font-display font-extrabold text-ink">
                {t("heroTitle")}
              </span>
              <span className="rounded-[0.4em] bg-primary-soft/35 px-2 py-0.5 font-serif font-medium text-ink [box-decoration-break:clone]">
                {t("heroTitleHighlight")}
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink/75">
              {t("heroDescription")}
            </p>
            <Link
              href="/get-started"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-yellow px-8 py-3.5 text-sm font-semibold text-ink shadow-sm transition-[filter] hover:brightness-95"
            >
              {t("joinButton")}
            </Link>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <Image
              src="/images/about-hero.png"
              alt="A caregiver and child together"
              width={1660}
              height={1436}
              priority
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* Two-column body */}
      <section className="bg-cream pb-16">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="stamp-edge grid gap-x-12 gap-y-6 bg-[#f6edcb] px-8 py-14 md:grid-cols-2 lg:px-16 lg:py-16">
            <div className="space-y-6">
              <Paragraph lead={t("columnOneP1Lead")} rest={t("columnOneP1Rest")} />
              <Paragraph lead={t("columnOneP2Lead")} rest={t("columnOneP2Rest")} />
              <Paragraph lead={t("columnOneP3Lead")} rest={t("columnOneP3Rest")} />
            </div>
            <div className="space-y-6">
              <Paragraph lead={t("columnTwoP1Lead")} rest={t("columnTwoP1Rest")} />
              <Paragraph lead={t("columnTwoP2Lead")} rest={t("columnTwoP2Rest")} />
            </div>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="bg-cream py-12 lg:py-20">
        <div className="mx-auto max-w-4xl px-5 text-center lg:px-8">
          <p className="relative font-serif text-3xl font-medium italic leading-snug text-ink sm:text-4xl lg:text-5xl">
            <span className="mr-1 align-top font-serif text-5xl not-italic text-sage lg:text-6xl">
              &ldquo;
            </span>
            {t("quote")}
            <span className="ml-1 align-top font-serif text-5xl not-italic text-sage lg:text-6xl">
              &rdquo;
            </span>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-cream pb-20 lg:pb-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="rounded-[2.5rem] bg-pink px-6 py-16 text-center lg:px-12">
            <h2 className="text-3xl leading-tight text-ink sm:text-4xl">
              <span className="font-display font-extrabold">{t("ctaTitle")}</span>
              <span className="font-serif font-medium italic text-ink/80">
                {t("ctaTitleEmphasis")}
              </span>
            </h2>
            <Link
              href="/get-started"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-yellow px-8 py-3.5 text-sm font-semibold text-ink shadow-sm transition-[filter] hover:brightness-95"
            >
              {t("memberButton")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
