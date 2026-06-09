"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

const PILLARS = [
  {
    title: "Raising Children",
    image: "/images/raising-children.png",
    body: "Children need more than supervision; they need emotionally steady, well-prepared adults who build deep self-trust and competence—so they can grow into their fullest selves.",
  },
  {
    title: "Raising Families",
    image: "/images/raising-families.png",
    body: "Families deserve an upgrade to their whole ecosystem—where quality care and real understanding of children are the norm, not the exception—so raising children feels shared, not lonely.",
  },
  {
    title: "Raising Caregivers",
    image: "/images/raising-caregivers.png",
    body: "Nannies, professional caregivers, and educators deserve respect, training, and real careers—so they can build stable, dignified lives.",
  },
  {
    title: "Raising Society",
    image: "/images/raising-society.png",
    body: "Care for children must be treated as essential infrastructure—so work and opportunity aren’t limited by who can afford care, and the next generation grows up ready to lead.",
  },
];

export function Mission() {
  const t = useTranslations("landing.mission");

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
              &ldquo;When families rise, society rises.&rdquo;
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
                At The Raising Club, we are:
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {PILLARS.map((p) => (
                <div
                  key={p.title}
                  className="flex flex-col rounded-3xl bg-white/70 p-5"
                >
                  <h3 className="text-xl leading-tight text-ink">
                    <span className="font-display font-extrabold">Raising </span>
                    <span className="font-serif italic font-semibold">
                      {p.title.replace("Raising ", "")}
                    </span>
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/75">
                    {p.body}
                  </p>
                  <div className="relative mt-5 aspect-[5/4] w-full overflow-hidden rounded-2xl">
                    <Image
                      src={p.image}
                      alt={p.title}
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
