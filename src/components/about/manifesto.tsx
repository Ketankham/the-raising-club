import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

// Manifesto body — split across two columns to match the live layout.
const COLUMN_ONE = [
  {
    lead: "Raising a child",
    rest: " shouldn’t feel improvised and lonely. But families are being asked to do everything—work, logistics, the mental load—while childcare still runs on patches.",
  },
  {
    lead: "The Raising Club",
    rest: " is building modern infrastructure for childhood: a membership platform where education, connection, and community live in one experience. Every adult around a child has a place here—parents, caregivers, grandparents, educators, and extended family.",
  },
  {
    lead: "",
    rest: "We take the best of child development science—brain development, learning, nutrition, language, and mental health—and turn it into guidance rooted in skills, regulation, and repair. That becomes daily practice: consistent routines, clear boundaries without yelling, environments that prevent chaos, and communication tools that reduce frustration.",
  },
];

const COLUMN_TWO = [
  {
    lead: "",
    rest: "We also rebuild the “village” for real life. TRC connects families with screened, trained caregivers and supports care setups that actually work: one-on-one care, nanny shares, pods, playdates, and local networks—made easier with clear agreements, defined roles, and a path that adapts as life changes.",
  },
  {
    lead: "",
    rest: "When you raise the standard of care, you change more than childhood. You professionalize caregiving careers, reduce parental anxiety, and sustain workforce participation—especially for mothers—because raising a child stops being a private problem and becomes shared infrastructure.",
  },
];

function Paragraph({ lead, rest }: { lead: string; rest: string }) {
  return (
    <p className="text-base leading-relaxed text-ink/80">
      {lead && <span className="font-bold text-ink">{lead}</span>}
      {rest}
    </p>
  );
}

export function Manifesto() {
  return (
    <>
      {/* Hero */}
      <section className="bg-cream">
        <div className="mx-auto max-w-7xl px-5 pt-8 lg:px-8">
          <Link
            href="/about-us"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 transition-colors hover:text-primary"
          >
            <ArrowLeft size={16} /> Back to about
          </Link>
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-14 pt-6 lg:grid-cols-2 lg:px-8 lg:pb-20">
          <div>
            <span className="inline-block rounded-full border border-ink/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-ink/70">
              Our Manifesto
            </span>
            <h1 className="mt-6 text-4xl leading-[1.18] sm:text-5xl">
              <span className="font-display font-extrabold text-ink">
                A new standard, where{" "}
              </span>
              <span className="rounded-[0.4em] bg-primary-soft/35 px-2 py-0.5 font-serif font-medium text-ink [box-decoration-break:clone]">
                care is education.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink/75">
              We&rsquo;re not building just an app. We&rsquo;re building modern
              infrastructure for childhood—a global club where every adult around
              a child belongs.
            </p>
            <Link
              href="/get-started"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-yellow px-8 py-3.5 text-sm font-semibold text-ink shadow-sm transition-[filter] hover:brightness-95"
            >
              Join the Club
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
              {COLUMN_ONE.map((p, i) => (
                <Paragraph key={i} {...p} />
              ))}
            </div>
            <div className="space-y-6">
              {COLUMN_TWO.map((p, i) => (
                <Paragraph key={i} {...p} />
              ))}
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
            Change childhood, and the future gets built differently.
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
              <span className="font-display font-extrabold">Are you ready to build</span>{" "}
              <span className="font-serif font-medium italic text-ink/80">
                the future with us?
              </span>
            </h2>
            <Link
              href="/get-started"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-yellow px-8 py-3.5 text-sm font-semibold text-ink shadow-sm transition-[filter] hover:brightness-95"
            >
              Become a Member
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
