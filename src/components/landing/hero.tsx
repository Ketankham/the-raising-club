import Image from "next/image";
import { Sparkles, ShieldCheck, GraduationCap } from "lucide-react";
import { JoinCards } from "./join-cards";

const HIGHLIGHTS = [
  { Icon: Sparkles, label: "Smart, AI-Powered Matching" },
  { Icon: ShieldCheck, label: "Layered Safety & Screening" },
  { Icon: GraduationCap, label: "TRC Training & Professional Development" },
];

export function Hero() {
  return (
    <section className="bg-cream">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 lg:grid-cols-2 lg:px-8 lg:py-20">
        <div>
          <h1 className="text-4xl leading-[1.14] sm:text-5xl">
            <span className="font-display font-extrabold text-primary">
              More Than Childcare:
            </span>{" "}
            <span className="font-serif font-medium text-ink/90">
              The club for{" "}
              <span className="rounded-md bg-primary-soft/40 px-2 py-0.5 text-ink">
                everyone
              </span>{" "}
              raising children.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink/75">
            Trusted care for families, real careers for caregivers, and reliable
            staffing and training for the programs that serve them—
            <strong className="font-semibold text-ink">
              all inside one club.
            </strong>
          </p>

          <JoinCards className="mt-9" />
        </div>

        {/* hero image (transparent scalloped photo + decorative flower overlays) */}
        <div className="relative mx-auto w-full max-w-xl">
          <Image
            src="/images/hero.png"
            alt="A caregiver and child sharing a high five"
            width={947}
            height={896}
            priority
            className="relative z-0 h-auto w-full"
          />
          <Image
            src="/images/flower-olive.png"
            alt=""
            aria-hidden
            width={168}
            height={209}
            className="pointer-events-none absolute -top-4 left-[10%] z-10 w-16 lg:w-24"
          />
          <Image
            src="/images/blob-yellow.png"
            alt=""
            aria-hidden
            width={177}
            height={196}
            className="pointer-events-none absolute top-[58%] -left-5 z-10 w-14 lg:w-20"
          />
          <Image
            src="/images/flower-sage.png"
            alt=""
            aria-hidden
            width={168}
            height={209}
            className="pointer-events-none absolute -bottom-3 left-2 z-10 w-16 lg:w-24"
          />
          <Image
            src="/images/flower-pink.png"
            alt=""
            aria-hidden
            width={228}
            height={212}
            className="pointer-events-none absolute -bottom-4 -right-3 z-10 w-20 lg:w-28"
          />
        </div>
      </div>

      {/* feature highlight strip */}
      <div className="mx-auto max-w-7xl px-5 pb-12 lg:px-8">
        <div className="grid gap-4 rounded-3xl bg-lavender px-6 py-6 sm:grid-cols-3">
          {HIGHLIGHTS.map(({ Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/80">
                <Icon size={20} className="text-primary" />
              </span>
              <span className="font-display text-sm font-semibold text-ink">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
