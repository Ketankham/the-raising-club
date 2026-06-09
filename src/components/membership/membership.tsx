"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { Flower } from "@/components/about/star-burst";
import type { Plan, Tab } from "@/lib/plans/types";

function priceView(plan: Plan, annual: boolean, t: any) {
  if (plan.price === "free") return { big: t("priceFree"), unit: "", sub: t("priceFreeSub") };
  if (plan.price === "custom")
    return { big: t("priceCustom"), unit: "", sub: plan.customLabel ?? "" };
  const unit = `/month${plan.unit ? ` ${plan.unit}` : ""}`;
  if (annual) {
    // Prefer the admin-set annual price; fall back to the 15%-off computation.
    const yearly = plan.priceAnnualCents != null
      ? Math.round(plan.priceAnnualCents / 100)
      : Math.round(plan.price * 12 * 0.85);
    const per = Math.round(yearly / 12);
    return { big: `$${per}`, unit, sub: `${t("priceBilledAnnually")} ($${yearly}${plan.unit ? " per site" : ""}/yr)` };
  }
  return { big: `$${plan.price}`, unit, sub: t("priceBilledMonthly") };
}

// Plan name: first word in serif italic, the remainder in bold sans —
// matches the Figma card headings (e.g. "*Family* Club+", "*Program* Core").
function planName(name: string) {
  const i = name.indexOf(" ");
  if (i === -1) return { accent: name, rest: "" };
  return { accent: name.slice(0, i), rest: name.slice(i) };
}

export function Membership({ tabs }: { tabs: Tab[] }) {
  const t = useTranslations("membership");
  const [tabId, setTabId] = useState<string>(tabs[0]?.id ?? "caregiver");
  const [annual, setAnnual] = useState(false);
  const tab = tabs.find((t) => t.id === tabId) ?? tabs[0];
  const showToggle = tab.id !== "centers";

  return (
    <section className="relative overflow-hidden bg-cream py-14 lg:py-20">
      <Flower className="pointer-events-none absolute left-2 top-44 h-28 w-28 text-sage/70" />
      <Flower className="pointer-events-none absolute right-3 top-1/2 h-32 w-32 text-pink/70" />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        {/* role tabs */}
        <div className="flex justify-center">
          <div className="inline-flex flex-wrap justify-center gap-1 rounded-full bg-lavender p-1.5">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTabId(t.id)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                  t.id === tabId
                    ? "bg-primary text-white shadow-sm"
                    : "text-ink/70 hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* centered page title */}
        <h1 className="mt-10 text-center text-4xl leading-tight text-ink sm:text-5xl lg:text-6xl">
          <span className="font-serif font-medium italic">{tab.heading.accent}</span>{" "}
          <span className="font-display font-extrabold">{tab.heading.rest}</span>
        </h1>

        {/* billing toggle */}
        {showToggle && (
          <div className="mt-7 flex justify-center">
            <div className="inline-flex items-center rounded-full bg-lavender p-1.5 text-sm font-semibold">
              <button
                onClick={() => setAnnual(false)}
                className={`rounded-full px-5 py-1.5 transition-colors ${
                  !annual ? "bg-white text-ink shadow-sm" : "text-ink/60"
                }`}
              >
                {t("monthly")}
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`inline-flex items-center gap-1.5 rounded-full px-5 py-1.5 transition-colors ${
                  annual ? "bg-white text-ink shadow-sm" : "text-ink/60"
                }`}
              >
                {t("annual")}
                <span className="text-xs font-bold text-olive">{t("save15")}</span>
              </button>
            </div>
          </div>
        )}

        {/* "all programs include" banner (centers only) */}
        {tab.includes && (
          <div className="mt-10 rounded-3xl bg-[#faf1e4] px-6 py-6">
            <p className="font-display text-sm font-bold uppercase tracking-wide text-ink">
              {t("allInclude")}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {tab.includes.map((inc) => (
                <div key={inc} className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-primary" strokeWidth={3} />
                  <span className="text-sm text-ink/80">{inc}</span>
                </div>
              ))}
            </div>
            {tab.includesNote && (
              <p className="mt-4 text-xs italic text-ink/60">{tab.includesNote}</p>
            )}
          </div>
        )}

        {/* plan cards */}
        <div className="mt-10 grid items-start gap-6 lg:grid-cols-3">
          {tab.plans.map((plan) => {
            const p = priceView(plan, annual && showToggle, t);
            const nm = planName(plan.name);
            return (
              <div
                key={plan.name}
                className={`relative flex h-full flex-col rounded-[2rem] border p-8 ${
                  plan.highlight
                    ? "border-[#e9c79a] bg-[#f5dab6] shadow-lg lg:scale-[1.02]"
                    : "border-[#f0e3d2] bg-[#faf1e4] shadow-sm"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-cream px-4 py-1.5 text-xs font-bold text-ink shadow-sm">
                    <Star size={12} className="fill-yellow text-yellow" />
                    {plan.badge}
                  </span>
                )}

                <h3 className="text-2xl text-ink">
                  <span className="font-serif font-medium italic">{nm.accent}</span>
                  <span className="font-display font-extrabold">{nm.rest}</span>
                </h3>
                {plan.subtitle && (
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-primary">
                    {plan.subtitle}
                  </p>
                )}

                <div className="mt-4 flex items-end gap-1">
                  <span className="font-display text-4xl font-extrabold text-ink">
                    {p.big}
                  </span>
                  {p.unit && (
                    <span className="mb-1 text-sm font-medium text-ink/60">
                      {p.unit}
                    </span>
                  )}
                </div>
                {p.sub && <p className="mt-1 text-xs text-ink/50">{p.sub}</p>}

                <p className="mt-4 text-sm leading-relaxed text-ink/75">
                  {plan.description}
                </p>

                <Link
                  href="/get-started"
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-yellow px-6 py-3 text-sm font-semibold text-ink shadow-sm transition-[filter] hover:brightness-95"
                >
                  {plan.cta}
                </Link>

                <ul className="mt-7 space-y-4 border-t border-ink/10 pt-6">
                  {plan.features.map((f) => (
                    <li key={f.label} className="flex gap-2.5">
                      <Check size={16} className="mt-0.5 shrink-0 text-primary" strokeWidth={3} />
                      <div>
                        <p className="font-display text-sm font-bold text-ink">
                          {f.label}
                        </p>
                        <p className="mt-0.5 text-sm leading-relaxed text-ink/70">
                          {f.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
