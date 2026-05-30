import Link from "next/link";
import { ArrowRight, Check, BookOpen, MapPin, UserRound } from "lucide-react";
import type { Role } from "./dashboard-shell";

/* Matches dashboard-expected-design (PDF p10): next-best-step hero, three
   tinted Connect/Learn/Events cards, and a "Your journey" stepper. */

function ThemeCard({
  tone, title, subtitle, children, cta, ctaHref, link, linkHref,
}: {
  tone: "peach" | "sage" | "lavender";
  title: string;
  subtitle: string;
  children: React.ReactNode;
  cta: string;
  ctaHref: string;
  link: string;
  linkHref: string;
}) {
  const bg = { peach: "bg-[#fbeadd]", sage: "bg-[#e6ecd6]", lavender: "bg-[#ece9f5]" }[tone];
  return (
    <div className={`flex flex-col rounded-2xl ${bg} p-5`}>
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
      <div className="my-4 flex-1 rounded-xl bg-white/80 p-4">{children}</div>
      <Link href={ctaHref} className="rounded-full bg-white py-2.5 text-center text-sm font-semibold text-ink shadow-sm transition hover:shadow">{cta}</Link>
      <Link href={linkHref} className="mt-2 text-center text-xs font-medium text-ink-soft hover:text-ink">{link}</Link>
    </div>
  );
}

export function DashboardHome({ name }: { role: Role; userId: string; name: string }) {
  return (
    <div className="relative">
      {/* decorative organic curves */}
      <svg className="pointer-events-none absolute -right-10 top-24 -z-0 h-64 w-64 text-purple/20" viewBox="0 0 200 200" fill="none"><path d="M40 100c0-60 120-80 120-20s-100 80-100 40 80-60 40-80" stroke="currentColor" strokeWidth="3" /></svg>
      <svg className="pointer-events-none absolute bottom-0 left-1/3 -z-0 h-40 w-72 text-primary/20" viewBox="0 0 300 120" fill="none"><path d="M10 60C60 10 120 110 160 60s100-60 130 0" stroke="currentColor" strokeWidth="3" /></svg>

      <div className="relative z-10">
        <h1 className="font-display text-3xl font-bold text-ink">Welcome back, {name}</h1>

        {/* NEXT BEST STEP */}
        <section className="mt-6 rounded-2xl bg-[#f3ead6] p-6 sm:p-8">
          <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-soft">Your next best step</p>
          <h2 className="mt-2 max-w-2xl font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl">Continue: Prepared Adult Module 2</h2>
          <p className="mt-3 max-w-2xl text-ink-soft">Pick up where you left off. This 4-minute lesson covers building emotional resilience in everyday moments.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/courses" className="inline-flex items-center gap-1.5 rounded-full bg-yellow px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-95">Continue Lesson <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/courses" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink shadow-sm">Show other options</Link>
          </div>
        </section>

        {/* THREE CARDS */}
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <ThemeCard tone="peach" title="Connect" subtitle="Build your club with other parents, caregivers or educators." cta="View your Raising Club" ctaHref="/connect" link="Invite someone" linkHref="/connect">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pink"><UserRound className="h-5 w-5 text-primary" /></span>
              <div>
                <p className="text-sm font-semibold text-ink">New suggestion</p>
                <p className="text-xs text-ink-soft">Maria G. — educator, 2 kids, your neighborhood</p>
              </div>
            </div>
          </ThemeCard>

          <ThemeCard tone="sage" title="Learn" subtitle="Short lessons you can use today." cta="Continue Lesson" ctaHref="/courses" link="Browse courses" linkHref="/courses">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sage"><BookOpen className="h-5 w-5 text-ink" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">Prepared Adult — Module 2</p>
                <p className="text-xs text-ink-soft">4 min · Continue where you left off</p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-ink/10"><div className="h-full w-1/2 rounded-full bg-olive" /></div>
              </div>
            </div>
          </ThemeCard>

          <ThemeCard tone="lavender" title="Events" subtitle="Meet people who care like you." cta="Reserve" ctaHref="/events" link="See calendar" linkHref="/events">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lavender"><MapPin className="h-5 w-5 text-purple" /></span>
              <div>
                <p className="text-sm font-semibold text-ink">Montessori Playroom</p>
                <p className="text-xs text-ink-soft">Kensington Park · 10:00 AM</p>
                <p className="mt-1 text-xs text-ink-soft">👥 4 going · spots available</p>
              </div>
            </div>
          </ThemeCard>
        </div>

        {/* YOUR JOURNEY */}
        <section className="mt-6 rounded-2xl bg-[#f3ead6] p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Your journey</h2>
          <p className="mt-1 text-sm text-ink-soft">Three simple steps to make the most of your club.</p>
          <ol className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
            {[
              { label: "Set your preferences", done: true },
              { label: "Take one foundation lesson", done: false },
              { label: "Attend your first gathering", done: false },
            ].map((s, i, arr) => (
              <li key={s.label} className="flex flex-1 items-center gap-3">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${s.done ? "bg-olive text-white" : "border-2 border-ink/20 text-transparent"}`}><Check className="h-4 w-4" /></span>
                <span className={`text-sm ${s.done ? "text-ink" : "text-ink-soft"}`}>{s.label}</span>
                {i < arr.length - 1 && <span className="hidden h-px flex-1 bg-ink/15 sm:block" />}
              </li>
            ))}
          </ol>
          <Link href="/dashboard" className="mt-5 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink shadow-sm">View my plan</Link>
        </section>
      </div>
    </div>
  );
}
