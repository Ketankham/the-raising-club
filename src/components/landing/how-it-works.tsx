import type { ReactNode } from "react";
import { Flower, StarBurst } from "@/components/about/star-burst";

type Step = {
  kicker: string;
  title: string;
  card: string;
  deco: ReactNode;
  body: ReactNode;
};

const STEPS: Step[] = [
  {
    kicker: "Join",
    title: "the Club",
    card: "bg-purple",
    deco: (
      <>
        <Flower className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 text-primary/70" />
        <StarBurst className="pointer-events-none absolute bottom-4 right-4 h-5 w-5 text-white/70" />
      </>
    ),
    body: (
      <>
        <strong className="font-semibold text-ink">Parents:</strong> share your
        children&rsquo;s ages, schedule, budget, and what matters most at home.{" "}
        <strong className="font-semibold text-ink">Caregivers:</strong> highlight
        your skills, experience, training, languages, and specialties.{" "}
        <strong className="font-semibold text-ink">Programs:</strong> add your
        open roles, age groups, and staffing needs.
      </>
    ),
  },
  {
    kicker: "Find",
    title: "Your Match",
    card: "bg-olive",
    deco: (
      <Flower className="pointer-events-none absolute -right-7 -top-9 h-32 w-32 text-white/85" />
    ),
    body: "Our matching system connects families, caregivers, and programs by location, schedule, age, languages, and values—and for nanny shares, we pair children with similar ages and routines so days run smoothly.",
  },
  {
    kicker: "Grow",
    title: "Together",
    card: "bg-primary",
    deco: (
      <>
        <Flower className="pointer-events-none absolute -right-9 -top-7 h-28 w-28 text-purple/80" />
        <Flower className="pointer-events-none absolute -right-5 -top-10 h-28 w-28 text-white/85" />
      </>
    ),
    body: "Caregivers build skills and badges through TRC training, programs upskill their teams, and families access guidance—so every adult around each child keeps growing with evidence-based care.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-cream py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="rounded-[2.5rem] bg-lavender px-6 py-14 lg:px-12 lg:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-extrabold text-ink sm:text-4xl lg:text-5xl">
              How It Works
            </h2>
            <p className="mt-5 text-lg text-ink/75">
              Getting started with{" "}
              <strong className="font-semibold text-ink">The Raising Club</strong>{" "}
              is simple. In three steps, families, caregivers, and programs
              connect inside one club for trusted care, real careers, and
              better-staffed programs.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step) => (
              <div
                key={step.kicker}
                className={`relative overflow-hidden rounded-3xl ${step.card} p-8`}
              >
                {step.deco}
                <h3 className="relative text-2xl leading-tight text-ink">
                  <span className="block font-display font-bold">
                    {step.kicker}
                  </span>
                  <span className="block font-serif font-medium italic">
                    {step.title}
                  </span>
                </h3>
                <p className="relative mt-3 text-sm leading-relaxed text-ink/80">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
