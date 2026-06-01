"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Star } from "lucide-react";
import { Flower } from "@/components/about/star-burst";

type Feature = { label: string; body: string };
type Plan = {
  name: string;
  price: number | "free" | "custom";
  unit?: string; // e.g. "per site"
  customLabel?: string;
  badge?: string; // e.g. "Most Popular"
  subtitle?: string;
  description: string;
  cta: string;
  highlight?: boolean;
  features: Feature[];
};
type Tab = {
  id: string;
  label: string;
  title: string; // e.g. "Caregiver & Educator"
  // Centered page heading, split so the first part renders in serif italic.
  heading: { accent: string; rest: string };
  includes?: string[];
  includesNote?: string;
  plans: Plan[];
};

const TABS: Tab[] = [
  {
    id: "caregiver",
    label: "Caregiver",
    title: "Caregiver & Educator",
    heading: { accent: "Caregiver & Educator", rest: "memberships" },
    plans: [
      {
        name: "TRC Community",
        price: "free",
        subtitle: "Start here",
        description:
          "Caregivers and educators starting on TRC, creating a professional profile, and applying to a limited number of roles.",
        cta: "Join for Free",
        features: [
          { label: "Job access", body: "Apply to a limited number of family and program roles each month." },
          { label: "Training & badge", body: "Foundational TRC lessons on safe care and early childhood principles." },
          { label: "Visibility", body: "Standard caregiver profile visible to families and programs." },
        ],
      },
      {
        name: "TRC Pro Caregiver",
        price: 19,
        subtitle: "Grow as a professional",
        description:
          "For career-focused caregivers & educators seeking consistent work and professional verification.",
        cta: "Become a TRC Pro Caregiver",
        badge: "Best value",
        highlight: true,
        features: [
          { label: "Best for", body: "Caregivers who want structured training, visible skills, and access to more stable, better-aligned roles as they grow professionally." },
          { label: "Job access", body: "Access to the full range of roles, including leadership opportunities, pods, and TRC-led initiatives." },
          { label: "Training & badge", body: "Structured TRC training with verified badges that make your skills visible to families and programs." },
          { label: "Visibility", body: "Enhanced profile visibility, prioritized for better-aligned family and program roles." },
        ],
      },
      {
        name: "TRC Lead Caregiver",
        price: 49,
        subtitle: "Lead and support others",
        description:
          "For experienced leaders managing pods, mentoring junior educators, or running micro-schools.",
        cta: "Apply as a TRC Lead Caregiver",
        features: [
          { label: "Best for", body: "Caregivers and educators with credentials in early childhood or advanced TRC training, prepared to guide others and support select family roles, including shared care such as learning pods and nanny shares." },
          { label: "Job access", body: "Access to the full range of roles, including leadership opportunities, pods, and TRC-led initiatives." },
          { label: "Training & badge", body: "Foundational TRC lessons on safe care and early childhood principles." },
          { label: "Community & growth", body: "Lead pods, circles, and learning spaces, and support the growth of other caregivers." },
        ],
      },
    ],
  },
  {
    id: "families",
    label: "Families",
    title: "Family",
    heading: { accent: "Family", rest: "memberships" },
    plans: [
      {
        name: "Family Essentials",
        price: "free",
        subtitle: "Start here",
        description:
          "For anyone caring for or spending time with a child—parents, grandparents, aunts, uncles—who wants to understand the basics of child development and explore The Raising Club’s events and community at their own pace.",
        cta: "Explore TRC",
        features: [
          { label: "Learning & guidance", body: "Foundational TRC guidance on child development and daily rhythms—simple, practical tools you can apply directly with your child." },
          { label: "Caregiver & extended family", body: "Training for one adult (you), with role-specific guidance (parent, grandparent, aunt, uncle, or other family member)." },
          { label: "Events & community", body: "Access to TRC events, community gatherings, and experiences—online and in person, where available." },
        ],
      },
      {
        name: "Family Access",
        price: 29,
        subtitle: "Go deeper",
        description:
          "For families who want deeper learning, and to start connecting with other families and caregivers as part of everyday family life.",
        cta: "Get Family Access",
        features: [
          { label: "Learning & guidance", body: "Everything in Family Essentials, plus the full A Raising Approach™ (one-on-one care) framework to raise a child with structure and shared understanding—with a partner and/or a caregiver." },
          { label: "Caregiver & extended family", body: "Training for up to 3 adults in your Raising Club, with role-specific guidance for parents, co-parents, grandparents, extended family, or household support." },
          { label: "Events & community", body: "Everything in Family Essentials, plus select TRC workshops and classes included as part of your membership." },
          { label: "Care search & matching", body: "Smart matching and messaging with caregivers and nearby families—for one-on-one care, playdates, and trusted parent connections." },
        ],
      },
      {
        name: "Family Club+",
        price: 49,
        badge: "Most popular",
        subtitle: "Coordinate care together",
        description:
          "For families coordinating care with others—including nanny shares, shared-care setups, or extended family—who want a more integrated way of doing things together.",
        cta: "Get Family Club+",
        highlight: true,
        features: [
          { label: "Learning & guidance", body: "Everything in Family Access, plus the A Raising Approach™ (shared care) framework for nanny shares, pods, and group care setups." },
          { label: "Caregiver & extended family", body: "Training for up to 5 adults in your Raising Club, with role-specific guidance. Additional training seats may be added as needed." },
          { label: "Events & community", body: "Everything in Family Access, plus the ability to host family gatherings and shared learning experiences—with support from TRC." },
          { label: "Care search & matching", body: "Everything in Family Access, plus added support for shared care setups like nanny shares, pods, and group care." },
          { label: "Parent–caregiver path", body: "Optional path to care for another child alongside your own, with structure, training, and support." },
        ],
      },
    ],
  },
  {
    id: "centers",
    label: "Centers & Programs",
    title: "Centers & Programs",
    heading: { accent: "Centers &", rest: "Programs" },
    includes: [
      "Unlimited job posts with filtering",
      "Public TRC profile signaling trained staff",
      "Access to a staffing bench of substitutes and floaters for coverage",
    ],
    includesNote: "Program plans differ by training capacity, tracking, and scale.",
    plans: [
      {
        name: "Program Core",
        price: 149,
        unit: "per site",
        subtitle: "Best for small centers needing essential tools and basic coverage.",
        description: "Home daycares and single-site programs building a stable, aligned team.",
        cta: "Get Started",
        features: [
          { label: "Training seats & tracking", body: "Starter training seats to onboard staff into TRC foundations (up to 4 staff members)." },
        ],
      },
      {
        name: "Program Growth",
        price: 349,
        unit: "per site",
        badge: "Most popular",
        subtitle: "Best for growing programs needing visibility and advanced tracking.",
        description: "Multi-site networks and chains standardizing hiring and training across locations.",
        cta: "See How It Works",
        highlight: true,
        features: [
          { label: "Training seats & tracking", body: "Director dashboard to assign, track, and verify courses and badges (up to 10 staff members)." },
        ],
      },
      {
        name: "Program Partner",
        price: "custom",
        customLabel: "Custom pricing. Get in touch to design your program.",
        subtitle: "Best for large networks or franchise operators needing enterprise solutions.",
        description: "Multi-site networks and chains standardizing hiring and training across locations.",
        cta: "Contact Us",
        features: [
          { label: "Training seats & tracking", body: "Custom training seats with advanced reporting and a co-branded learning hub (seat count tailored to your program)." },
        ],
      },
    ],
  },
];

function priceView(plan: Plan, annual: boolean) {
  if (plan.price === "free") return { big: "Free", unit: "", sub: "Free forever" };
  if (plan.price === "custom")
    return { big: "Custom", unit: "", sub: plan.customLabel ?? "" };
  const unit = `/month${plan.unit ? ` ${plan.unit}` : ""}`;
  if (annual) {
    const per = Math.round(plan.price * 0.85);
    const yearly = Math.round(plan.price * 12 * 0.85);
    return { big: `$${per}`, unit, sub: `Billed annually ($${yearly}${plan.unit ? " per site" : ""}/yr)` };
  }
  return { big: `$${plan.price}`, unit, sub: "Billed monthly" };
}

// Plan name: first word in serif italic, the remainder in bold sans —
// matches the Figma card headings (e.g. "*Family* Club+", "*Program* Core").
function planName(name: string) {
  const i = name.indexOf(" ");
  if (i === -1) return { accent: name, rest: "" };
  return { accent: name.slice(0, i), rest: name.slice(i) };
}

export function Membership() {
  const [tabId, setTabId] = useState("caregiver");
  const [annual, setAnnual] = useState(false);
  const tab = TABS.find((t) => t.id === tabId)!;
  const showToggle = tab.id !== "centers";

  return (
    <section className="relative overflow-hidden bg-cream py-14 lg:py-20">
      <Flower className="pointer-events-none absolute left-2 top-44 h-28 w-28 text-sage/70" />
      <Flower className="pointer-events-none absolute right-3 top-1/2 h-32 w-32 text-pink/70" />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        {/* role tabs */}
        <div className="flex justify-center">
          <div className="inline-flex flex-wrap justify-center gap-1 rounded-full bg-lavender p-1.5">
            {TABS.map((t) => (
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
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`inline-flex items-center gap-1.5 rounded-full px-5 py-1.5 transition-colors ${
                  annual ? "bg-white text-ink shadow-sm" : "text-ink/60"
                }`}
              >
                Annual
                <span className="text-xs font-bold text-olive">Save 15%</span>
              </button>
            </div>
          </div>
        )}

        {/* "all programs include" banner (centers only) */}
        {tab.includes && (
          <div className="mt-10 rounded-3xl bg-[#faf1e4] px-6 py-6">
            <p className="font-display text-sm font-bold uppercase tracking-wide text-ink">
              All TRC Programs Include
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
            const p = priceView(plan, annual && showToggle);
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
