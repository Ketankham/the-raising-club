import { Sparkles, ShieldCheck, GraduationCap } from "lucide-react";
import { JoinCards } from "./join-cards";

const HIGHLIGHTS = [
  { Icon: Sparkles, label: "Smart, AI-Powered Matching", color: "bg-purple/30" },
  { Icon: ShieldCheck, label: "Layered Safety & Screening", color: "bg-olive/30" },
  {
    Icon: GraduationCap,
    label: "TRC Training & Professional Development",
    color: "bg-yellow/40",
  },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-lavender">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-purple/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-primary-soft/30 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
        <div>
          <h1 className="font-display text-4xl font-extrabold leading-[1.1] text-ink sm:text-5xl lg:text-[3.4rem]">
            More Than Childcare:{" "}
            <span className="text-primary">
              The club for everyone raising children.
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

        {/* hero collage */}
        <div className="relative mx-auto aspect-square w-full max-w-md">
          <div className="absolute inset-0 rotate-3 rounded-[2.5rem] bg-primary-soft/40" />
          <div className="absolute inset-3 -rotate-2 overflow-hidden rounded-[2.5rem] bg-white shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=900&q=80"
              alt="A caregiver and child sharing a joyful moment"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-4 -left-4 grid h-20 w-20 place-items-center rounded-3xl bg-olive/70 text-3xl">
            🧸
          </div>
          <div className="absolute -right-3 top-6 grid h-16 w-16 place-items-center rounded-2xl bg-yellow/80 text-2xl">
            ⭐
          </div>
        </div>
      </div>

      {/* feature highlight strip */}
      <div className="relative mx-auto max-w-7xl px-5 pb-14 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {HIGHLIGHTS.map(({ Icon, label, color }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl bg-white/70 px-5 py-4 shadow-sm backdrop-blur"
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${color}`}>
                <Icon size={20} className="text-ink" />
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
