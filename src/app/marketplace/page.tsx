import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FadeUp } from "@/components/marketplace-landing/fade-up";
import { HeroNetwork } from "@/components/marketplace-landing/hero-network";

export const metadata: Metadata = {
  title: "Marketplace — The Raising Club",
  description:
    "One marketplace connecting caregivers seeking opportunities, parents finding trusted care, and organisations building their teams — plus the community, courses and events that tie it all together.",
};

/** Every CTA on this public page funnels into the onboarding flow. */
const JOIN = "/onboarding";

const STATS = [
  { n: "1,200+", l: "Verified Caregivers" },
  { n: "3,400+", l: "Families Connected" },
  { n: "180+", l: "Organisations" },
  { n: "60+", l: "Courses & Events" },
];

type Node = { emoji: string; label: string; bg: string; fg: string };

const CONNECTIONS: {
  left: Node;
  right: Node;
  badge: string;
  track: string;
  title: string;
  desc: string;
}[] = [
  {
    left: { emoji: "👨‍👩‍👧", label: "Parent", bg: "#fdedda", fg: "#a05014" },
    right: { emoji: "🤲", label: "Caregiver", bg: "#e7f0f5", fg: "#617d8a" },
    badge: "Find Care",
    track: "linear-gradient(to right,#ef9a4a,#617d8a)",
    title: "Parents find Caregivers",
    desc: "Browse verified nannies, educators, babysitters and specialists by location, availability and age group.",
  },
  {
    left: { emoji: "🤲", label: "Caregiver", bg: "#e7f0f5", fg: "#617d8a" },
    right: { emoji: "📋", label: "Job listing", bg: "#ebf5fc", fg: "#375a6a" },
    badge: "Apply",
    track: "linear-gradient(to right,#617d8a,#375a6a)",
    title: "Caregivers find Jobs & Gigs",
    desc: "Full-time, part-time, temporary and recurring gigs posted by real families in your area.",
  },
  {
    left: { emoji: "🏫", label: "Organisation", bg: "#edf8e0", fg: "#508c32" },
    right: { emoji: "🤲", label: "Caregiver", bg: "#e7f0f5", fg: "#617d8a" },
    badge: "Hire",
    track: "linear-gradient(to right,#a4c97e,#617d8a)",
    title: "Organisations source Caregivers",
    desc: "Childcare centres and schools access a vetted pool of professionals, with credential verification built in.",
  },
  {
    left: { emoji: "👨‍👩‍👧", label: "Parent", bg: "#fdedda", fg: "#a05014" },
    right: { emoji: "👨‍👩‍👦", label: "Parent", bg: "#fdedda", fg: "#a05014" },
    badge: "Community",
    track: "linear-gradient(to right,#ef9a4a,#ef9a4a)",
    title: "Parents connect with Parents",
    desc: "Arrange playdates, share recommendations and build a local parent community in your neighbourhood.",
  },
  {
    left: { emoji: "🤲", label: "Caregiver", bg: "#e7f0f5", fg: "#617d8a" },
    right: { emoji: "🤲", label: "Caregiver", bg: "#e7f0f5", fg: "#617d8a" },
    badge: "Peer network",
    track: "linear-gradient(to right,#617d8a,#617d8a)",
    title: "Caregivers support each other",
    desc: "Share knowledge, cover shifts, refer clients and grow professionally as part of a peer community.",
  },
];

const WHO: {
  emoji: string;
  badgeBg: string;
  title: string;
  desc: string;
  features: string[];
  cta: { label: string; bg: string; fg: string };
}[] = [
  {
    emoji: "👨‍👩‍👧",
    badgeBg: "#fdf2e2",
    title: "Parents",
    desc: "Find verified, local caregivers and build community with other families around you.",
    features: [
      "Browse & filter verified caregivers by distance, rate, age group",
      "Post your care needs and get matched with caregivers",
      "Connect with nearby parents — organise playdates & share tips",
      "Enrol in parenting courses and attend community events",
    ],
    cta: { label: "Join as a Parent →", bg: "#fdf2e2", fg: "#82460a" },
  },
  {
    emoji: "🤲",
    badgeBg: "#e7f0f5",
    title: "Caregivers",
    desc: "Find work that fits your schedule, grow your skills and build a professional peer network.",
    features: [
      "Browse job listings from families — full-time, part-time or gigs",
      "Get discovered by families and organisations seeking your skills",
      "Connect with other caregivers — share shifts, referrals and insights",
      "Take professional development courses and earn verifiable badges",
    ],
    cta: { label: "Join as a Caregiver →", bg: "#617d8a", fg: "#ffffff" },
  },
  {
    emoji: "🏫",
    badgeBg: "#edf8e0",
    title: "Organisations",
    desc: "Source qualified caregivers, post open roles, and build a reliable professional pipeline.",
    features: [
      "Access a vetted pool of credentialled care professionals",
      "Post open positions and manage applications in one place",
      "View caregiver course completions and verified certifications",
      "Host events and courses to attract and develop talent",
    ],
    cta: { label: "Join as an Organisation →", bg: "#edf8e0", fg: "#3c6e1e" },
  },
];

const COURSES = [
  { ico: "📘", title: "Infant Care Fundamentals", meta: "Caregivers · Parents · 6 weeks", tag: "Open" },
  { ico: "🛡️", title: "Child Safety & First Aid", meta: "All roles · 1 day", tag: "Open" },
  { ico: "🌱", title: "Positive Discipline Methods", meta: "Caregivers · 4 weeks", tag: "Open" },
];

const EVENTS = [
  { ico: "🌙", title: "Caregiver Networking Night", meta: "Caregivers · Tue 20 May, 7 PM", tag: "12 spots" },
  { ico: "🧸", title: "Summer Playdate Mixer", meta: "Parents · Thu 5 Jun, 10 AM", tag: "Free" },
  { ico: "🤝", title: "Organisation Hiring Fair", meta: "All roles · Wed 18 Jun, 9 AM", tag: "Registering" },
];

const JOIN_CARDS: {
  emoji: string;
  title: string;
  desc: string;
  perks: string[];
  dot: string;
  btn: { label: string; bg: string; fg: string };
  highlight?: boolean;
}[] = [
  {
    emoji: "👨‍👩‍👧",
    title: "Parent",
    desc: "Find trusted caregivers, connect with other families and build your care community.",
    perks: [
      "Browse & filter verified caregivers",
      "Post care needs and get matched",
      "Connect with parent community",
      "Access courses and events",
    ],
    dot: "#ef9a4a",
    btn: { label: "Get Started as a Parent", bg: "#ef9a4a", fg: "#ffffff" },
  },
  {
    emoji: "🤲",
    title: "Caregiver",
    desc: "Build your profile, find opportunities that match your skills and connect with peers.",
    perks: [
      "Create your verified caregiver profile",
      "Browse & apply for jobs and gigs",
      "Join the caregiver peer network",
      "Earn course badges & get discovered",
    ],
    dot: "#617d8a",
    btn: { label: "Get Started as a Caregiver", bg: "#617d8a", fg: "#ffffff" },
    highlight: true,
  },
  {
    emoji: "🏫",
    title: "Organisation",
    desc: "Source verified professionals, manage hiring and invest in team development.",
    perks: [
      "Access a vetted pool of caregivers",
      "Post open positions & manage applications",
      "View verified credentials & course badges",
      "Host events & recruit at community fairs",
    ],
    dot: "#a4c97e",
    btn: { label: "Get Started as an Organisation", bg: "#a4c97e", fg: "#285914" },
  },
];

function Check({ stroke }: { stroke: string }) {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

export default function MarketplacePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-cream text-[#4b3a25]">
        {/* ── HERO ── */}
        <div className="bg-gradient-to-b from-[#fffbf6] to-cream">
          <div className="mx-auto grid max-w-[1360px] items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-20">
            <div>
              <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-[#e7f0f5] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.07em] text-[#617d8a]">
                <span className="h-2 w-2 rounded-full bg-[#617d8a]" />
                The Raising Club Marketplace
              </span>
              <h1 className="font-display text-[clamp(2.6rem,5vw,4.1rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
                Where care communities{" "}
                <em className="font-light not-italic text-[#617d8a]">find each other</em>
              </h1>
              <p className="mt-5 max-w-[460px] text-[17px] leading-relaxed text-[#897970]">
                A single marketplace connecting caregivers seeking opportunities, parents finding trusted care, organisations building their teams — and everyone finding community.
              </p>
              <p className="mb-3 mt-9 text-[11px] font-bold uppercase tracking-[0.08em] text-[#b8a79d]">
                Get started as
              </p>
              <div className="flex flex-col gap-2.5 sm:flex-row">
                {[
                  { emoji: "👨‍👩‍👧", bg: "#fdf2e2", title: "Parent", hint: "Find care & community →" },
                  { emoji: "🤲", bg: "#e7f0f5", title: "Caregiver", hint: "Find work & grow →" },
                  { emoji: "🏫", bg: "#edf8e0", title: "Organisation", hint: "Build your team →" },
                ].map((c) => (
                  <Link
                    key={c.title}
                    href={JOIN}
                    className="flex flex-1 flex-col rounded-2xl border-[1.5px] border-[#e5ddd5] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#617d8a] hover:shadow-[0_4px_18px_rgba(97,125,138,0.14)]"
                  >
                    <span className="mb-2.5 grid h-8 w-8 place-items-center rounded-[10px] text-[15px]" style={{ background: c.bg }}>
                      {c.emoji}
                    </span>
                    <span className="text-[13px] font-bold text-[#4b3a25]">{c.title}</span>
                    <span className="text-[11px] font-medium text-[#b8a79d]">{c.hint}</span>
                  </Link>
                ))}
              </div>
            </div>
            <HeroNetwork />
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="flex justify-center border-y border-[#e5ddd5] bg-white py-8">
          <div className="grid w-full max-w-[960px] grid-cols-2 sm:grid-cols-4">
            {STATS.map((s, i) => (
              <div key={s.l} className={`px-6 text-center sm:px-10 ${i < STATS.length - 1 ? "sm:border-r sm:border-[#e5ddd5]" : ""}`}>
                <div className="font-display text-[40px] font-extrabold leading-none tracking-[-0.03em] text-[#4b3a25]">{s.n}</div>
                <div className="mt-1 text-[12.5px] font-medium text-[#897970]">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CONNECTIONS ── */}
        <section id="connections" className="mx-auto max-w-[1200px] px-6 py-20 lg:py-22">
          <FadeUp>
            <span className="inline-flex items-center rounded-full bg-[#e7f0f5] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.07em] text-[#617d8a]">
              Every kind of connection
            </span>
            <h2 className="mt-3 font-display text-[clamp(2.1rem,3.5vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.025em]">
              One marketplace,<br />every connection type
            </h2>
            <p className="mb-13 mt-3 max-w-[540px] text-[16.5px] leading-relaxed text-[#897970]">
              The Raising Club isn&apos;t just a job board. It&apos;s a living network where every role finds the right match — including peer-to-peer.
            </p>
          </FadeUp>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
            {CONNECTIONS.map((c, i) => (
              <FadeUp key={c.title} delay={80 * (i + 1)}>
                <div className="group h-full rounded-[20px] border border-[#e5ddd5] bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(75,58,37,0.09)]">
                  <div className="mb-4 flex items-center">
                    <div className="flex shrink-0 flex-col items-center gap-1.5">
                      <span className="grid h-10 w-10 place-items-center rounded-full text-[12px] font-bold" style={{ background: c.left.bg, color: c.left.fg }}>{c.left.emoji}</span>
                      <span className="whitespace-nowrap text-[9px] font-semibold text-[#897970]">{c.left.label}</span>
                    </div>
                    <div className="flex flex-1 flex-col items-center gap-1 px-1">
                      <span className="h-[1.5px] w-full" style={{ background: c.track }} />
                      <span className="whitespace-nowrap text-[8px] font-bold uppercase tracking-[0.04em] text-[#b8a79d]">{c.badge}</span>
                    </div>
                    <div className="flex shrink-0 flex-col items-center gap-1.5">
                      <span className="grid h-10 w-10 place-items-center rounded-full text-[12px] font-bold" style={{ background: c.right.bg, color: c.right.fg }}>{c.right.emoji}</span>
                      <span className="whitespace-nowrap text-[9px] font-semibold text-[#897970]">{c.right.label}</span>
                    </div>
                  </div>
                  <div className="mb-1.5 text-[14px] font-bold leading-tight text-[#4b3a25]">{c.title}</div>
                  <div className="text-[12px] leading-relaxed text-[#897970]">{c.desc}</div>
                </div>
              </FadeUp>
            ))}
          </div>
        </section>

        {/* ── WHO ── */}
        <div className="border-t border-[#e5ddd5] bg-white">
          <section id="who" className="mx-auto max-w-[1200px] px-6 py-20 lg:py-22">
            <FadeUp>
              <span className="inline-flex items-center rounded-full bg-[#edf8e0] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.07em] text-[#508c32]">
                Built for every role
              </span>
              <h2 className="mt-3 font-display text-[clamp(2.1rem,3.5vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.025em]">
                What the marketplace<br />does for you
              </h2>
              <p className="mb-13 mt-3 max-w-[540px] text-[16.5px] leading-relaxed text-[#897970]">
                Every user type gets a tailored experience — browse caregivers, post jobs, or source staff — all within one community.
              </p>
            </FadeUp>

            <div className="grid gap-6 md:grid-cols-3">
              {WHO.map((w, i) => (
                <FadeUp key={w.title} delay={80 * (i + 1)} className="h-full">
                  <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#e5ddd5] bg-white">
                    <div className="px-7 pt-8">
                      <span className="mb-4 grid h-[50px] w-[50px] place-items-center rounded-2xl text-[22px]" style={{ background: w.badgeBg }}>{w.emoji}</span>
                      <h3 className="mb-2.5 font-display text-[26px] font-extrabold tracking-[-0.02em] text-[#4b3a25]">{w.title}</h3>
                      <p className="mb-6 text-[13.5px] leading-relaxed text-[#897970]">{w.desc}</p>
                      <ul className="mb-7 flex flex-col gap-2.5">
                        {w.features.map((f) => (
                          <li key={f} className="flex items-start gap-2.5 text-[13px] font-medium leading-snug text-[#4b3a25]">
                            <span className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full" style={{ background: w.badgeBg }}>
                              <Check stroke={w.cta.bg === "#617d8a" ? "#375a6a" : w.cta.fg} />
                            </span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-auto px-7 pb-7">
                      <Link
                        href={JOIN}
                        className="block w-full rounded-[14px] py-3 text-center text-[13.5px] font-bold transition-opacity hover:opacity-90"
                        style={{ background: w.cta.bg, color: w.cta.fg }}
                      >
                        {w.cta.label}
                      </Link>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </section>
        </div>

        {/* ── LEARNING ── */}
        <div className="border-y border-[#e5ddd5] bg-white">
          <div id="learning" className="mx-auto max-w-[1200px] px-6 py-20 lg:py-22">
            <FadeUp>
              <span className="inline-flex items-center rounded-full bg-[#edf8e0] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.07em] text-[#508c32]">
                Learn &amp; grow together
              </span>
              <h2 className="mt-3 font-display text-[clamp(2.1rem,3.5vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.025em]">
                Courses &amp; events connect the whole community
              </h2>
              <p className="mb-13 mt-3 max-w-[540px] text-[16.5px] leading-relaxed text-[#897970]">
                Learning isn&apos;t separate from the marketplace — it&apos;s woven in. Courses build credentials caregivers can showcase; events bring all three user types together in real life.
              </p>
            </FadeUp>

            <div className="grid gap-7 md:grid-cols-2">
              <FadeUp delay={80}>
                <div className="h-full rounded-3xl border border-[#d2ebb9] bg-[#edf8e0] p-8">
                  <span className="mb-3.5 inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.07em] text-[#467828]">
                    Courses
                  </span>
                  <h3 className="mb-2 font-display text-[26px] font-extrabold tracking-[-0.02em] text-[#4b3a25]">Grow your credentials</h3>
                  <p className="mb-5 text-[13.5px] leading-relaxed text-[#897970]">
                    Structured courses available to caregivers, parents and organisations. Completed courses appear directly on caregiver profiles as verifiable badges.
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {COURSES.map((s) => (
                      <div key={s.title} className="flex items-center gap-3 rounded-xl border border-[#e5ddd5] bg-white/85 px-3.5 py-3">
                        <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] bg-white/70 text-[13px]">{s.ico}</span>
                        <div>
                          <div className="text-[13px] font-semibold text-[#4b3a25]">{s.title}</div>
                          <div className="text-[11px] text-[#897970]">{s.meta}</div>
                        </div>
                        <span className="ml-auto shrink-0 rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-bold text-[#467828]">{s.tag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeUp>

              <FadeUp delay={160}>
                <div className="h-full rounded-3xl border border-[#f5d2a5] bg-[#fdf2e2] p-8">
                  <span className="mb-3.5 inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.07em] text-[#a05014]">
                    Events
                  </span>
                  <h3 className="mb-2 font-display text-[26px] font-extrabold tracking-[-0.02em] text-[#4b3a25]">Meet your community IRL</h3>
                  <p className="mb-5 text-[13.5px] leading-relaxed text-[#897970]">
                    Local events create real-world touchpoints for all roles. Networking nights, hiring fairs, playdate meetups and hands-on workshops.
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {EVENTS.map((s) => (
                      <div key={s.title} className="flex items-center gap-3 rounded-xl border border-[#e5ddd5] bg-white/85 px-3.5 py-3">
                        <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] bg-white/70 text-[13px]">{s.ico}</span>
                        <div>
                          <div className="text-[13px] font-semibold text-[#4b3a25]">{s.title}</div>
                          <div className="text-[11px] text-[#897970]">{s.meta}</div>
                        </div>
                        <span className="ml-auto shrink-0 rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-bold text-[#a05014]">{s.tag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeUp>
            </div>
          </div>
        </div>

        {/* ── JOIN CTA ── */}
        <section id="join" className="bg-[#4b3a25] px-6 py-24">
          <div className="mx-auto max-w-[1200px]">
            <FadeUp>
              <h2 className="font-display text-[clamp(2.25rem,4vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.025em] text-white">
                Ready to join the<br />
                <em className="font-light not-italic text-white/55">Raising Club?</em>
              </h2>
              <p className="mb-13 mt-2.5 max-w-[520px] text-[16px] leading-relaxed text-white/60">
                Choose your role and create your profile in minutes. Free to get started.
              </p>
            </FadeUp>

            <div className="grid gap-[18px] md:grid-cols-3">
              {JOIN_CARDS.map((c, i) => (
                <FadeUp key={c.title} delay={80 * (i + 1)} className="h-full">
                  <div className={`flex h-full flex-col rounded-3xl border p-7 transition-colors ${c.highlight ? "border-white/20 bg-white/10" : "border-white/10 bg-white/[0.07] hover:bg-white/[0.12]"}`}>
                    <span className="mb-4 grid h-[46px] w-[46px] place-items-center rounded-[14px] bg-white/10 text-[20px]">{c.emoji}</span>
                    <h3 className="mb-2 font-display text-[22px] font-bold tracking-[-0.015em] text-white">{c.title}</h3>
                    <p className="mb-5 text-[13px] leading-relaxed text-white/60">{c.desc}</p>
                    <ul className="mb-6 flex flex-col gap-2">
                      {c.perks.map((p) => (
                        <li key={p} className="flex items-center gap-2 text-[12.5px] text-white/80">
                          <span className="h-[5px] w-[5px] shrink-0 rounded-full" style={{ background: c.dot }} />
                          {p}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={JOIN}
                      className="mt-auto block w-full rounded-[14px] py-3 text-center text-[13.5px] font-bold transition-opacity hover:opacity-90"
                      style={{ background: c.btn.bg, color: c.btn.fg }}
                    >
                      {c.btn.label}
                    </Link>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
