"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

const PILLAR_IMAGES = [
  "/images/raising-children.png",
  "/images/raising-families.png",
  "/images/raising-caregivers.png",
  "/images/raising-society.png",
];

export function Mission() {
  const t = useTranslations("landing.mission");
  const raisingPrefix = t("raisingPrefix");
  const pillars = (t.raw("pillars") as { accent: string; body: string }[]).map((p, i) => ({
    ...p,
    image: PILLAR_IMAGES[i],
  }));

  return (
    <>
      {/* Quote band — sage with white flowers (asset) + cream cloud banner */}
      <section className="relative isolate overflow-hidden bg-sage">
        <Image
          src="/images/quote-band.png"
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          className="-z-10 object-cover"
        />
        <div className="px-5 py-12 sm:py-16">
          <div className="cloud-banner mx-auto max-w-3xl bg-cream px-8 py-10 text-center sm:px-12">
            <p className="font-serif text-2xl font-medium leading-snug text-ink sm:text-3xl lg:text-[2.5rem]">
              &ldquo;{t("quote")}&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* Why The Raising Club — on a pink panel */}
      <section className="bg-cream py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="rounded-[2.5rem] bg-pink px-6 py-14 lg:px-12">
            <div className="mx-auto max-w-3xl text-center">
              <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-primary">
                {t("title")}
              </p>
              <h2 className="mt-4 font-display text-3xl font-extrabold text-ink sm:text-4xl lg:text-5xl">
                {t("title")}
              </h2>
              <p className="mt-5 text-lg text-ink/75">
                {t("description")}
              </p>
              <p className="mt-6 font-display text-base font-semibold text-ink">
                {t("weAreLabel")}
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {pillars.map((p) => (
                <div
                  key={p.accent}
                  className="flex flex-col rounded-3xl bg-white/70 p-5"
                >
                  <h3 className="text-xl leading-tight text-ink">
                    <span className="font-display font-extrabold">{raisingPrefix}</span>
                    <span className="font-serif italic font-semibold">{p.accent}</span>
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/75">
                    {p.body}
                  </p>
                  <div className="relative mt-5 aspect-[5/4] w-full overflow-hidden rounded-2xl">
                    <Image
                      src={p.image}
                      alt={`${raisingPrefix}${p.accent}`}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
