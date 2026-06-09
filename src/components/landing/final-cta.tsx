"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { JoinCards } from "./join-cards";

const CAREGIVERS = [
  { name: "Emily G.", img: "/images/emily.png", exp: "2+ years of experience", rate: "$57/hr", rating: "5.0" },
  { name: "Jessica T.", img: "/images/jessica.png", exp: "5+ years of experience", rate: "$26/hr", rating: "4.9" },
  { name: "Sarah C.", img: "/images/sarah.png", exp: "3+ years of experience", rate: "$23/hr", rating: "4.8" },
];

function StoreBadge({ top, bottom }: { top: string; bottom: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-white">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16.5 3c-1 .1-2.2.7-2.9 1.5-.6.7-1.1 1.8-.9 2.8 1.1.1 2.2-.6 2.9-1.4.6-.8 1-1.8.9-2.9ZM12 8c-1.3 0-2.2-.8-3.5-.8C6.8 7.2 5 8.6 5 11.5c0 2.9 2.1 6.1 3.3 6.1.7 0 1.2-.5 2.3-.5s1.5.5 2.3.5c1.3 0 3.1-3 3.1-4.8-2-.9-2-3.6 0-4.5C17.3 8.4 16.4 8 15.5 8c-1.3 0-2.2 0-3.5 0Z" />
      </svg>
      <span className="text-left leading-tight">
        <span className="block text-[9px] uppercase">{top}</span>
        <span className="block text-sm font-semibold">{bottom}</span>
      </span>
    </span>
  );
}

export function FinalCta() {
  const t = useTranslations("landing.cta");

  return (
    <section className="bg-lavender/60">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8 lg:py-24">
        <div>
          <h2 className="text-3xl leading-tight text-ink sm:text-4xl lg:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-5 max-w-xl text-lg text-ink/75">
            {t("description")}
          </p>
          <JoinCards className="mt-9" />

          <div className="mt-10 flex flex-wrap gap-3">
            <StoreBadge top="GET IT ON" bottom="Google Play" />
            <StoreBadge top="Download on the" bottom="App Store" />
          </div>
        </div>

        {/* floating caregiver profile cards */}
        <div className="mx-auto grid w-full max-w-md gap-4 sm:grid-cols-2">
          {CAREGIVERS.map((c, i) => (
            <div
              key={c.name}
              className={`rounded-3xl border border-black/5 bg-white p-4 shadow-sm ${
                i === 2 ? "sm:col-span-2 sm:flex sm:items-center sm:gap-4" : ""
              }`}
            >
              <div className={`relative overflow-hidden rounded-2xl ${i === 2 ? "aspect-[3/2] sm:w-44 sm:shrink-0" : "aspect-[3/2] w-full"}`}>
                <Image
                  src={c.img}
                  alt={c.name}
                  fill
                  sizes="240px"
                  className="object-cover"
                />
              </div>
              <div className={i === 2 ? "mt-3 sm:mt-0" : "mt-3"}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display text-sm font-bold text-ink">{c.name}</p>
                  <span className="flex items-center gap-1 text-primary">
                    <Star size={13} fill="currentColor" strokeWidth={0} />
                    <span className="text-xs font-semibold text-ink">{c.rating}</span>
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-ink/60">{c.exp}</p>
                <p className="mt-1 font-display text-sm font-bold text-primary">
                  {c.rate}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
