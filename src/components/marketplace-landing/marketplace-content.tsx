"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FadeUp } from "./fade-up";
import { HeroNetwork } from "./hero-network";

const JOIN = "/onboarding";

function Check({ stroke }: { stroke: string }) {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

export function MarketplaceContent() {
  const t = useTranslations("marketplacePage");

  // Stat data structure
  const stats = [
    { n: t("stat1Number"), l: t("stat1Label") },
    { n: t("stat2Number"), l: t("stat2Label") },
    { n: t("stat3Number"), l: t("stat3Label") },
    { n: t("stat4Number"), l: t("stat4Label") },
  ];

  // Connection cards data
  const connections = [
    {
      left: { emoji: "👨‍👩‍👧", label: t("roleParent"), bg: "#fdedda", fg: "#a05014" },
      right: { emoji: "🤲", label: t("roleCaregiver"), bg: "#e7f0f5", fg: "#617d8a" },
      badge: t("connectionBadge1"),
      track: "linear-gradient(to right,#ef9a4a,#617d8a)",
      title: t("connectionTitle1"),
      desc: t("connectionDesc1"),
    },
    {
      left: { emoji: "🤲", label: t("roleCaregiver"), bg: "#e7f0f5", fg: "#617d8a" },
      right: { emoji: "📋", label: t("connectionJobLabel"), bg: "#ebf5fc", fg: "#375a6a" },
      badge: t("connectionBadge2"),
      track: "linear-gradient(to right,#617d8a,#375a6a)",
      title: t("connectionTitle2"),
      desc: t("connectionDesc2"),
    },
    {
      left: { emoji: "🏫", label: t("roleOrganization"), bg: "#edf8e0", fg: "#508c32" },
      right: { emoji: "🤲", label: t("roleCaregiver"), bg: "#e7f0f5", fg: "#617d8a" },
      badge: t("connectionBadge3"),
      track: "linear-gradient(to right,#a4c97e,#617d8a)",
      title: t("connectionTitle3"),
      desc: t("connectionDesc3"),
    },
    {
      left: { emoji: "👨‍👩‍👧", label: t("roleParent"), bg: "#fdedda", fg: "#a05014" },
      right: { emoji: "👨‍👩‍👦", label: t("roleParent"), bg: "#fdedda", fg: "#a05014" },
      badge: t("connectionBadge4"),
      track: "linear-gradient(to right,#ef9a4a,#ef9a4a)",
      title: t("connectionTitle4"),
      desc: t("connectionDesc4"),
    },
    {
      left: { emoji: "🤲", label: t("roleCaregiver"), bg: "#e7f0f5", fg: "#617d8a" },
      right: { emoji: "🤲", label: t("roleCaregiver"), bg: "#e7f0f5", fg: "#617d8a" },
      badge: t("connectionBadge5"),
      track: "linear-gradient(to right,#617d8a,#617d8a)",
      title: t("connectionTitle5"),
      desc: t("connectionDesc5"),
    },
  ];

  // Who section data
  const whoData = [
    {
      emoji: "👨‍👩‍👧",
      badgeBg: "#fdf2e2",
      title: t("roleParentTitle"),
      desc: t("roleParentDesc"),
      features: [t("roleParentFeature1"), t("roleParentFeature2"), t("roleParentFeature3"), t("roleParentFeature4")],
      cta: { label: t("roleParentCta"), bg: "#fdf2e2", fg: "#82460a" },
    },
    {
      emoji: "🤲",
      badgeBg: "#e7f0f5",
      title: t("roleCaregiverTitle"),
      desc: t("roleCaregiverDesc"),
      features: [t("roleCaregiverFeature1"), t("roleCaregiverFeature2"), t("roleCaregiverFeature3"), t("roleCaregiverFeature4")],
      cta: { label: t("roleCaregiverCta"), bg: "#617d8a", fg: "#ffffff" },
    },
    {
      emoji: "🏫",
      badgeBg: "#edf8e0",
      title: t("roleOrganizationTitle"),
      desc: t("roleOrganizationDesc"),
      features: [t("roleOrganizationFeature1"), t("roleOrganizationFeature2"), t("roleOrganizationFeature3"), t("roleOrganizationFeature4")],
      cta: { label: t("roleOrganizationCta"), bg: "#edf8e0", fg: "#3c6e1e" },
    },
  ];

  // Courses data
  const courses = [
    { ico: "📘", title: t("course1Title"), meta: t("course1Meta"), tag: t("course1Tag") },
    { ico: "🛡️", title: t("course2Title"), meta: t("course2Meta"), tag: t("course2Tag") },
    { ico: "🌱", title: t("course3Title"), meta: t("course3Meta"), tag: t("course3Tag") },
  ];

  // Events data
  const events = [
    { ico: "🌙", title: t("event1Title"), meta: t("event1Meta"), tag: t("event1Tag") },
    { ico: "🧸", title: t("event2Title"), meta: t("event2Meta"), tag: t("event2Tag") },
    { ico: "🤝", title: t("event3Title"), meta: t("event3Meta"), tag: t("event3Tag") },
  ];

  // Join cards data
  const joinCards = [
    {
      emoji: "👨‍👩‍👧",
      title: t("roleParentTitle"),
      desc: t("roleParentDesc"),
      perks: [t("joinCtaParentPerks1"), t("joinCtaParentPerks2"), t("joinCtaParentPerks3"), t("joinCtaParentPerks4")],
      dot: "#ef9a4a",
      btn: { label: t("joinCtaParentBtn"), bg: "#ef9a4a", fg: "#ffffff" },
    },
    {
      emoji: "🤲",
      title: t("roleCaregiverTitle"),
      desc: t("roleCaregiverDesc"),
      perks: [t("joinCtaCaregiverPerks1"), t("joinCtaCaregiverPerks2"), t("joinCtaCaregiverPerks3"), t("joinCtaCaregiverPerks4")],
      dot: "#617d8a",
      btn: { label: t("joinCtaCaregiverBtn"), bg: "#617d8a", fg: "#ffffff" },
      highlight: true,
    },
    {
      emoji: "🏫",
      title: t("roleOrganizationTitle"),
      desc: t("roleOrganizationDesc"),
      perks: [t("joinCtaOrganizationPerks1"), t("joinCtaOrganizationPerks2"), t("joinCtaOrganizationPerks3"), t("joinCtaOrganizationPerks4")],
      dot: "#a4c97e",
      btn: { label: t("joinCtaOrganizationBtn"), bg: "#a4c97e", fg: "#285914" },
    },
  ];

  return (
    <main className="flex-1 bg-cream text-[#4b3a25]">
      {/* HERO */}
      <div className="bg-gradient-to-b from-[#fffbf6] to-cream">
        <div className="mx-auto grid max-w-[1360px] items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-20">
          <div>
            <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-[#e7f0f5] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.07em] text-[#617d8a]">
              <span className="h-2 w-2 rounded-full bg-[#617d8a]" />
              {t("heroBadge")}
            </span>
            <h1 className="font-display text-[clamp(2.6rem,5vw,4.1rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
              {t("heroTitle1")} <em className="font-light not-italic text-[#617d8a]">{t("heroTitle2")}</em>
            </h1>
            <p className="mt-5 max-w-[460px] text-[17px] leading-relaxed text-[#897970]">{t("heroDescription")}</p>
            <p className="mb-3 mt-9 text-[11px] font-bold uppercase tracking-[0.08em] text-[#b8a79d]">{t("heroGetStartedLabel")}</p>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              {[
                { emoji: "👨‍👩‍👧", bg: "#fdf2e2", title: t("roleParent"), hint: t("roleParentHint") },
                { emoji: "🤲", bg: "#e7f0f5", title: t("roleCaregiver"), hint: t("roleCaregiverHint") },
                { emoji: "🏫", bg: "#edf8e0", title: t("roleOrganization"), hint: t("roleOrganizationHint") },
              ].map((c) => (
                <Link key={c.title} href={JOIN} className="flex flex-1 flex-col rounded-2xl border-[1.5px] border-[#e5ddd5] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#617d8a] hover:shadow-[0_4px_18px_rgba(97,125,138,0.14)]">
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

      {/* STATS */}
      <div className="flex justify-center border-y border-[#e5ddd5] bg-white py-8">
        <div className="grid w-full max-w-[960px] grid-cols-2 sm:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s.l} className={`px-6 text-center sm:px-10 ${i < stats.length - 1 ? "sm:border-r sm:border-[#e5ddd5]" : ""}`}>
              <div className="font-display text-[40px] font-extrabold leading-none tracking-[-0.03em] text-[#4b3a25]">{s.n}</div>
              <div className="mt-1 text-[12.5px] font-medium text-[#897970]">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CONNECTIONS */}
      <section id="connections" className="mx-auto max-w-[1200px] px-6 py-20 lg:py-22">
        <FadeUp>
          <span className="inline-flex items-center rounded-full bg-[#e7f0f5] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.07em] text-[#617d8a]">{t("connectionsSectionLabel")}</span>
          <h2 className="mt-3 font-display text-[clamp(2.1rem,3.5vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.025em]">{t("connectionsSectionTitle")}</h2>
          <p className="mb-13 mt-3 max-w-[540px] text-[16.5px] leading-relaxed text-[#897970]">{t("connectionsSectionDesc")}</p>
        </FadeUp>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
          {connections.map((c, i) => (
            <FadeUp key={c.title} delay={80 * (i + 1)}>
              <div className="group h-full rounded-[20px] border border-[#e5ddd5] bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(75,58,37,0.09)]">
                <div className="mb-4 flex items-center">
                  <div className="flex shrink-0 flex-col items-center gap-1.5">
                    <span className="grid h-10 w-10 place-items-center rounded-full text-[12px] font-bold" style={{ background: c.left.bg, color: c.left.fg }}>
                      {c.left.emoji}
                    </span>
                    <span className="whitespace-nowrap text-[9px] font-semibold text-[#897970]">{c.left.label}</span>
                  </div>
                  <div className="flex flex-1 flex-col items-center gap-1 px-1">
                    <span className="h-[1.5px] w-full" style={{ background: c.track }} />
                    <span className="whitespace-nowrap text-[8px] font-bold uppercase tracking-[0.04em] text-[#b8a79d]">{c.badge}</span>
                  </div>
                  <div className="flex shrink-0 flex-col items-center gap-1.5">
                    <span className="grid h-10 w-10 place-items-center rounded-full text-[12px] font-bold" style={{ background: c.right.bg, color: c.right.fg }}>
                      {c.right.emoji}
                    </span>
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

      {/* WHO */}
      <div className="border-t border-[#e5ddd5] bg-white">
        <section id="who" className="mx-auto max-w-[1200px] px-6 py-20 lg:py-22">
          <FadeUp>
            <span className="inline-flex items-center rounded-full bg-[#edf8e0] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.07em] text-[#508c32]">{t("whoSectionLabel")}</span>
            <h2 className="mt-3 font-display text-[clamp(2.1rem,3.5vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.025em]">{t("whoSectionTitle")}</h2>
            <p className="mb-13 mt-3 max-w-[540px] text-[16.5px] leading-relaxed text-[#897970]">{t("whoSectionDesc")}</p>
          </FadeUp>

          <div className="grid gap-6 md:grid-cols-3">
            {whoData.map((w, i) => (
              <FadeUp key={w.title} delay={80 * (i + 1)} className="h-full">
                <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#e5ddd5] bg-white">
                  <div className="px-7 pt-8">
                    <span className="mb-4 grid h-[50px] w-[50px] place-items-center rounded-2xl text-[22px]" style={{ background: w.badgeBg }}>
                      {w.emoji}
                    </span>
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
                    <Link href={JOIN} className="block w-full rounded-[14px] py-3 text-center text-[13.5px] font-bold transition-opacity hover:opacity-90" style={{ background: w.cta.bg, color: w.cta.fg }}>
                      {w.cta.label}
                    </Link>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </section>
      </div>

      {/* LEARNING */}
      <div className="border-y border-[#e5ddd5] bg-white">
        <div id="learning" className="mx-auto max-w-[1200px] px-6 py-20 lg:py-22">
          <FadeUp>
            <span className="inline-flex items-center rounded-full bg-[#edf8e0] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.07em] text-[#508c32]">{t("learningLabel")}</span>
            <h2 className="mt-3 font-display text-[clamp(2.1rem,3.5vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.025em]">{t("learningTitle")}</h2>
            <p className="mb-13 mt-3 max-w-[540px] text-[16.5px] leading-relaxed text-[#897970]">{t("learningDesc")}</p>
          </FadeUp>

          <div className="grid gap-7 md:grid-cols-2">
            <FadeUp delay={80}>
              <div className="h-full rounded-3xl border border-[#d2ebb9] bg-[#edf8e0] p-8">
                <span className="mb-3.5 inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.07em] text-[#467828]">{t("coursesLabel")}</span>
                <h3 className="mb-2 font-display text-[26px] font-extrabold tracking-[-0.02em] text-[#4b3a25]">{t("coursesTitle")}</h3>
                <p className="mb-5 text-[13.5px] leading-relaxed text-[#897970]">{t("coursesDesc")}</p>
                <div className="flex flex-col gap-2.5">
                  {courses.map((s) => (
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
                <span className="mb-3.5 inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.07em] text-[#a05014]">{t("eventsLabel")}</span>
                <h3 className="mb-2 font-display text-[26px] font-extrabold tracking-[-0.02em] text-[#4b3a25]">{t("eventsTitle")}</h3>
                <p className="mb-5 text-[13.5px] leading-relaxed text-[#897970]">{t("eventsDesc")}</p>
                <div className="flex flex-col gap-2.5">
                  {events.map((s) => (
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

      {/* JOIN CTA */}
      <section id="join" className="bg-[#4b3a25] px-6 py-24">
        <div className="mx-auto max-w-[1200px]">
          <FadeUp>
            <h2 className="font-display text-[clamp(2.25rem,4vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.025em] text-white">
              {t("joinCtaTitle")}
              <br />
              <em className="font-light not-italic text-white/55"></em>
            </h2>
            <p className="mb-13 mt-2.5 max-w-[520px] text-[16px] leading-relaxed text-white/60">{t("joinCtaDesc")}</p>
          </FadeUp>

          <div className="grid gap-[18px] md:grid-cols-3">
            {joinCards.map((c, i) => (
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
                  <Link href={JOIN} className="mt-auto block w-full rounded-[14px] py-3 text-center text-[13.5px] font-bold transition-opacity hover:opacity-90" style={{ background: c.btn.bg, color: c.btn.fg }}>
                    {c.btn.label}
                  </Link>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
