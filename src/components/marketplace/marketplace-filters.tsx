"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X, RotateCcw, MapPin } from "lucide-react";
import { CARE_TYPE_LABELS, CARE_TYPES, type CareType } from "@/lib/marketplace/format";
import type { MarketplaceFilters } from "@/lib/marketplace/types";

const AGE_MAX = 144; // 12 years, in months

function monthsLabel(m: number): string {
  if (m >= AGE_MAX) return "12 years";
  if (m < 24) return `${m} mo`;
  return `${Math.round(m / 12)} yrs`;
}

/** Shared marketplace filter rail (Figma): Care Type chips, Age Groups slider,
 *  Where (city/zip). URL-driven; `basePath` lets it serve /connect, /connect/
 *  families, and /jobs. (Map view is a follow-up — text/zip match for now.) */
export function MarketplaceFilters({
  initial,
  basePath,
}: {
  initial: MarketplaceFilters;
  basePath: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [care, setCare] = useState<CareType[]>(initial.careTypes ?? []);
  const [ageMax, setAgeMax] = useState(initial.ageMax ?? AGE_MAX);
  const [where, setWhere] = useState(initial.where ?? "");

  function apply() {
    const p = new URLSearchParams();
    if (initial.q) p.set("q", initial.q);
    if (care.length) p.set("care", care.join(","));
    if (ageMax < AGE_MAX) p.set("ageMax", String(ageMax));
    if (where.trim()) p.set("where", where.trim());
    const qs = p.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
    setOpen(false);
  }

  function clearAll() {
    setCare([]);
    setAgeMax(AGE_MAX);
    setWhere("");
    router.push(basePath);
    setOpen(false);
  }

  const form = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink">
          <SlidersHorizontal size={16} /> Filters
        </h2>
        <button onClick={clearAll} className="flex items-center gap-1 text-sm font-medium text-olive hover:underline">
          <RotateCcw size={13} /> Clear all
        </button>
      </div>

      {/* Care Type */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">Care Type</legend>
        <div className="flex flex-col gap-2">
          {CARE_TYPES.map((t) => {
            const on = care.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => setCare((s) => (on ? s.filter((x) => x !== t) : [...s, t]))}
                className={`self-start rounded-full border px-3.5 py-1.5 text-sm transition ${
                  on ? "border-olive bg-sage/50 text-ink" : "border-ink/15 bg-white text-ink-soft hover:border-ink/30"
                }`}
              >
                {CARE_TYPE_LABELS[t as CareType]}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Age Groups */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">Age Groups</legend>
        <input
          type="range"
          min={0}
          max={AGE_MAX}
          step={1}
          value={ageMax}
          onChange={(e) => setAgeMax(Number(e.target.value))}
          className="w-full accent-olive"
          aria-label="Maximum child age in months"
        />
        <div className="mt-1 flex justify-between text-xs text-ink-soft">
          <span>0 months</span>
          <span className="font-medium text-olive">{monthsLabel(ageMax)}</span>
          <span>12 years</span>
        </div>
      </fieldset>

      {/* Where */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">Where</legend>
        <div className="flex items-center gap-2 rounded-lg border border-ink/15 bg-white px-3 py-2">
          <MapPin size={15} className="text-ink-soft" />
          <input
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            placeholder="Enter city or zip code"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/70"
          />
        </div>
      </fieldset>

      <button
        onClick={apply}
        className="w-full rounded-full bg-olive py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
      >
        Apply Filters
      </button>
    </div>
  );

  return (
    <>
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-24 rounded-2xl bg-mint/50 p-5">{form}</div>
      </aside>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink lg:hidden"
      >
        <SlidersHorizontal size={16} /> Filters
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-cream p-5">
            <div className="mb-2 flex justify-end">
              <button onClick={() => setOpen(false)} aria-label="Close filters" className="grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-lavender">
                <X size={20} />
              </button>
            </div>
            {form}
          </div>
        </div>
      )}
    </>
  );
}
