"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X, RotateCcw, MapPin, BadgeCheck, ShieldCheck } from "lucide-react";
import { CARE_TYPE_LABELS, CARE_TYPES, type CareType } from "@/lib/marketplace/format";
import { PlacesAutocomplete } from "@/components/ui/places-autocomplete";
import type { MarketplaceFilters } from "@/lib/marketplace/types";

const AGE_MAX = 144; // 12 years, in months

function monthsLabel(m: number): string {
  if (m >= AGE_MAX) return "Any age";
  if (m < 24) return `${m} mo`;
  return `${Math.round(m / 12)} yrs`;
}

function buildQs(q: string | undefined, care: CareType[], ageMax: number, where: string, verified: boolean, bgcheck: boolean): string {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (care.length) p.set("care", care.join(","));
  if (ageMax < AGE_MAX) p.set("ageMax", String(ageMax));
  if (where.trim()) p.set("where", where.trim());
  if (verified) p.set("verified", "1");
  if (bgcheck) p.set("bgcheck", "1");
  return p.toString();
}

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
  const [verified, setVerified] = useState(!!initial.verifiedOnly);
  const [bgcheck, setBgcheck] = useState(!!initial.backgroundCheckedOnly);
  const sliderCommitRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-push when care chips change
  function toggleCare(t: CareType) {
    const next = care.includes(t) ? care.filter((x) => x !== t) : [...care, t];
    setCare(next);
    push(next, ageMax, where, verified, bgcheck);
  }

  // Debounce slider so we don't push on every pixel
  function handleSliderChange(v: number) {
    setAgeMax(v);
    if (sliderCommitRef.current) clearTimeout(sliderCommitRef.current);
    sliderCommitRef.current = setTimeout(() => push(care, v, where, verified, bgcheck), 400);
  }

  function push(c: CareType[], age: number, w: string, v: boolean, bg: boolean) {
    const qs = buildQs(initial.q, c, age, w, v, bg);
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  function applyWhere(w: string) {
    setWhere(w);
    push(care, ageMax, w, verified, bgcheck);
    setOpen(false);
  }

  function toggleVerified() {
    const next = !verified;
    setVerified(next);
    push(care, ageMax, where, next, bgcheck);
  }

  function toggleBgcheck() {
    const next = !bgcheck;
    setBgcheck(next);
    push(care, ageMax, where, verified, next);
  }

  function clearAll() {
    setCare([]);
    setAgeMax(AGE_MAX);
    setWhere("");
    setVerified(false);
    setBgcheck(false);
    router.push(basePath);
    setOpen(false);
  }

  const hasActive = care.length > 0 || ageMax < AGE_MAX || !!where || verified || bgcheck;

  const form = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink">
          <SlidersHorizontal size={16} /> Filters
        </h2>
        {hasActive && (
          <button onClick={clearAll} className="flex items-center gap-1 text-sm font-medium text-olive hover:underline">
            <RotateCcw size={13} /> Clear all
          </button>
        )}
      </div>

      {/* Care Type */}
      <fieldset>
        <legend className="mb-2.5 text-sm font-semibold text-ink">Care Type</legend>
        <div className="flex flex-col gap-2">
          {CARE_TYPES.map((t) => {
            const on = care.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleCare(t)}
                className={`self-start rounded-full border px-4 py-2 text-sm font-medium transition ${
                  on
                    ? "border-olive bg-olive/15 text-ink"
                    : "border-ink/15 bg-white text-ink-soft hover:border-olive/50 hover:text-ink"
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
        <legend className="mb-2.5 text-sm font-semibold text-ink">Max child age</legend>
        <input
          type="range"
          min={0}
          max={AGE_MAX}
          step={6}
          value={ageMax}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          className="w-full accent-olive"
          aria-label="Maximum child age"
        />
        <div className="mt-1.5 flex justify-between text-xs text-ink-soft">
          <span>0 mo</span>
          <span className={`font-semibold ${ageMax < AGE_MAX ? "text-olive" : "text-ink-soft"}`}>
            {monthsLabel(ageMax)}
          </span>
          <span>12 yrs</span>
        </div>
      </fieldset>

      {/* Where */}
      <fieldset>
        <legend className="mb-2.5 text-sm font-semibold text-ink">Location</legend>
        <div className="flex items-center gap-2 rounded-lg border border-ink/15 bg-white px-3 py-2 focus-within:border-olive">
          <MapPin size={15} className="shrink-0 text-ink-soft" />
          <PlacesAutocomplete
            placeholder="City, neighborhood, or ZIP"
            types={["geocode"]}
            initialValue={where}
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/70"
            onPlace={(p) => applyWhere(p.city ?? p.zipCode ?? p.formatted)}
          />
          {where && (
            <button onClick={() => applyWhere("")} className="shrink-0 text-ink-soft hover:text-ink">
              <X size={14} />
            </button>
          )}
        </div>
        {where && <p className="mt-1 text-xs text-olive">Filtering by: {where}</p>}
      </fieldset>

      {/* Trust & Safety */}
      <fieldset>
        <legend className="mb-2.5 text-sm font-semibold text-ink">Trust &amp; Safety</legend>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={toggleVerified}
            className={`flex items-center gap-2 self-start rounded-full border px-4 py-2 text-sm font-medium transition ${
              verified
                ? "border-olive bg-olive/15 text-ink"
                : "border-ink/15 bg-white text-ink-soft hover:border-olive/50 hover:text-ink"
            }`}
          >
            <BadgeCheck className="h-4 w-4 text-olive" />
            Identity Verified
          </button>
          <button
            type="button"
            onClick={toggleBgcheck}
            className={`flex items-center gap-2 self-start rounded-full border px-4 py-2 text-sm font-medium transition ${
              bgcheck
                ? "border-[#4a6b9a] bg-[#4a6b9a]/10 text-ink"
                : "border-ink/15 bg-white text-ink-soft hover:border-[#4a6b9a]/50 hover:text-ink"
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-[#4a6b9a]" />
            Background Checked
          </button>
        </div>
        <p className="mt-2.5 text-[11px] leading-relaxed text-ink-soft">
          Verification is processed by Authenticate.{" "}
          <a href="/terms" className="underline hover:text-ink">Terms</a>
        </p>
      </fieldset>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — wider than before */}
      <aside className="hidden w-72 shrink-0 lg:block">
        <div className="sticky top-24 rounded-2xl bg-mint/40 p-6">{form}</div>
      </aside>

      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold lg:hidden ${
          hasActive ? "border-olive bg-olive/10 text-ink" : "border-ink/15 bg-white text-ink"
        }`}
      >
        <SlidersHorizontal size={16} />
        Filters{hasActive ? ` (${care.length + (ageMax < AGE_MAX ? 1 : 0) + (where ? 1 : 0) + (verified ? 1 : 0) + (bgcheck ? 1 : 0)})` : ""}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-3xl bg-cream p-6">
            <div className="mb-3 flex justify-end">
              <button onClick={() => setOpen(false)} aria-label="Close filters" className="grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-lavender">
                <X size={20} />
              </button>
            </div>
            {form}
            <button onClick={() => setOpen(false)} className="mt-5 w-full rounded-full bg-olive py-2.5 text-sm font-semibold text-white">
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
