import { Star } from "lucide-react";
import { JoinCards } from "./join-cards";

const SAMPLE_CAREGIVERS = [
  { name: "Maya R.", exp: "2+ years of experience", color: "bg-purple/30" },
  { name: "Daniel K.", exp: "5+ years of experience", color: "bg-olive/30" },
  { name: "Aisha M.", exp: "3+ years of experience", color: "bg-yellow/40" },
];

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-lavender">
      <div className="pointer-events-none absolute -right-20 -top-10 h-72 w-72 rounded-full bg-primary-soft/30 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
        <div>
          <h2 className="font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl lg:text-5xl">
            Start your <span className="text-primary">Raising Club</span> journey
            today
          </h2>
          <p className="mt-5 max-w-xl text-lg text-ink/75">
            Join for free and be part of a club where everyone raising children
            connects, works, and learns together.
          </p>
          <JoinCards className="mt-9" />
        </div>

        {/* decorative caregiver cards */}
        <div className="mx-auto grid w-full max-w-md gap-4 sm:grid-cols-2">
          {SAMPLE_CAREGIVERS.map((c, i) => (
            <div
              key={c.name}
              className={`rounded-3xl border border-black/5 bg-white p-5 shadow-sm ${
                i === 2 ? "sm:col-span-2" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`grid h-12 w-12 place-items-center rounded-full ${c.color} text-lg`}>
                  👩‍🍼
                </span>
                <div>
                  <p className="font-display text-sm font-bold text-ink">
                    {c.name}
                  </p>
                  <p className="text-xs text-ink/60">{c.exp}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-primary">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} size={14} fill="currentColor" strokeWidth={0} />
                ))}
                <span className="ml-1 text-xs text-ink/60">Verified</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
