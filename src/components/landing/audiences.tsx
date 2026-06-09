"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";

type Audience = {
  title: string;
  tagline: string;
  image: string;
  cardBg: string;
  cta: { label: string; href: string };
  points: { heading: string; body: string }[];
};

export function Audiences() {
  const t = useTranslations("landing.audiences");

  const AUDIENCES: Audience[] = [
    {
      title: t("forParents"),
      tagline: t("parentTagline"),
      image: "/images/for-parents.png",
      cardBg: "bg-lavender/60",
      cta: { label: t("parentCta"), href: "/get-started?role=family" },
      points: t.raw("parentPoints") as Audience["points"],
    },
    {
      title: t("forCaregivers"),
      tagline: t("caregiverTagline"),
      image: "/images/for-caregivers.png",
      cardBg: "bg-olive/20",
      cta: { label: t("caregiverCta"), href: "/onboarding?role=caregiver" },
      points: t.raw("caregiverPoints") as Audience["points"],
    },
    {
      title: t("forOrganizations"),
      tagline: t("organizationTagline"),
      image: "/images/for-centers.png",
      cardBg: "bg-primary-soft/20",
      cta: { label: t("organizationCta"), href: "/onboarding?role=organization" },
      points: t.raw("organizationPoints") as Audience["points"],
    },
  ];

  return (
    <section id="built-for-everyone" className="bg-cream py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-extrabold text-ink sm:text-4xl lg:text-5xl">
            {t("sectionHeading")}
          </h2>
          <p className="mt-5 text-lg text-ink/75">{t("sectionSubtitle")}</p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {AUDIENCES.map((a) => (
            <div
              key={a.title}
              className={`flex flex-col overflow-hidden rounded-3xl ${a.cardBg} p-5`}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
                <Image
                  src={a.image}
                  alt={a.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>

              <h3 className="mt-5 font-display text-2xl font-extrabold text-ink">
                {a.title}
              </h3>
              <p className="mt-2 text-sm text-ink/75">{a.tagline}</p>

              <ul className="mt-5 flex-1 space-y-4">
                {a.points.map((p) => (
                  <li key={p.heading} className="flex gap-2.5">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <div>
                      <h4 className="font-display text-sm font-bold text-ink">
                        {p.heading}
                      </h4>
                      <p className="mt-0.5 text-sm leading-relaxed text-ink/70">
                        {p.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <Link
                href={a.cta.href}
                className="mt-7 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-primary-hover"
              >
                {a.cta.label}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
