"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X, MapPin } from "lucide-react";
import { ageLabel } from "@/lib/events/format";
import {
  EVENT_STYLE_LABELS,
  PARTICIPATION_TAGS,
  type EventFilters,
  type EventJoinMode,
  type EventStyle,
  type ParticipationType,
} from "@/lib/events/types";

const AGE_MAX = 144; // 12 years, in months
const PRICE_MAX = 160;
const PURPLE = "#baaae1";
const JOIN_OPTIONS: { value: EventJoinMode; label: string }[] = [
  { value: "online", label: "Online" },
  { value: "in_person", label: "In-Person" },
];

// Default OpenStreetMap view (New York City) for the "Where" preview — no API
// key required. Purely a visual aid; filtering is by the city/zip text below.
const OSM_SRC =
  "https://www.openstreetmap.org/export/embed.html?bbox=-74.06,40.66,-73.86,40.82&layer=mapnik";

function toggle<T>(set: T[], value: T): T[] {
  return set.includes(value) ? set.filter((v) => v !== value) : [...set, value];
}

export function EventsFilters({ initial }: { initial: EventFilters }) {
  const [open, setOpen] = useState(false); // mobile sheet
  const router = useRouter();

  const [ageMax, setAgeMax] = useState(initial.ageMax ?? AGE_MAX);
  const [priceMax, setPriceMax] = useState(initial.priceMax ?? PRICE_MAX);
  // "How you'll join" is single-select (Online OR In-Person); click again clears.
  const [join, setJoin] = useState<EventJoinMode | "">(initial.joinModes?.[0] ?? "");
  const [near, setNear] = useState(initial.near ?? "");
  const [who, setWho] = useState<ParticipationType[]>(initial.whoAttends ?? []);
  const [style, setStyle] = useState<EventStyle | "">(initial.styles?.[0] ?? "");
  const [date, setDate] = useState(initial.date ?? "");
  const [dateTo, setDateTo] = useState(initial.dateTo ?? "");

  function apply() {
    const p = new URLSearchParams();
    if (initial.q) p.set("q", initial.q); // keep any active search
    if (ageMax < AGE_MAX) p.set("ageMax", String(ageMax));
    if (priceMax < PRICE_MAX) p.set("priceMax", String(priceMax));
    if (join) p.set("join", join);
    if (near.trim()) p.set("near", near.trim());
    if (who.length) p.set("who", who.join(","));
    if (style) p.set("style", style);
    if (date) p.set("date", date);
    if (dateTo) p.set("dateTo", dateTo);
    const qs = p.toString();
    router.push(qs ? `/events?${qs}` : "/events");
    setOpen(false);
  }

  function clearAll() {
    setAgeMax(AGE_MAX);
    setPriceMax(PRICE_MAX);
    setJoin("");
    setNear("");
    setWho([]);
    setStyle("");
    setDate("");
    setDateTo("");
    router.push("/events");
    setOpen(false);
  }

  const form = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink">
          <SlidersHorizontal size={16} style={{ color: PURPLE }} /> Filters
        </h2>
        <button
          type="button"
          onClick={clearAll}
          className="text-sm font-semibold text-[#8b76c2] hover:underline"
        >
          Clear all
        </button>
      </div>

      {/* Child's age */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">Child&apos;s age</legend>
        <input
          type="range"
          min={0}
          max={AGE_MAX}
          step={1}
          value={ageMax}
          onChange={(e) => setAgeMax(Number(e.target.value))}
          className="w-full accent-[#baaae1]"
          aria-label="Maximum child age in months"
        />
        <div className="mt-1 flex justify-between text-xs text-ink-soft">
          <span>0 months</span>
          <span className="font-semibold text-[#8b76c2]">
            {ageMax >= AGE_MAX ? "12 years" : ageLabel(ageMax)}
          </span>
          <span>12 years</span>
        </div>
      </fieldset>

      {/* How you'll join */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">How you&apos;ll join</legend>
        <div className="space-y-2.5">
          {JOIN_OPTIONS.map((o) => (
            <CircleCheck
              key={o.value}
              label={o.label}
              checked={join === o.value}
              onChange={() => setJoin((cur) => (cur === o.value ? "" : o.value))}
            />
          ))}
        </div>
      </fieldset>

      {/* Where */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">Where</legend>
        <div className="relative">
          <MapPin
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60"
          />
          <input
            type="text"
            value={near}
            onChange={(e) => setNear(e.target.value)}
            placeholder="Enter city or zip code"
            className="w-full rounded-xl border border-ink/15 bg-white py-2 pl-9 pr-3 text-sm text-ink outline-none focus:border-[#baaae1]"
          />
        </div>
        <div className="mt-2 overflow-hidden rounded-xl border border-ink/10">
          <iframe
            title="Map preview"
            src={OSM_SRC}
            loading="lazy"
            className="h-32 w-full"
            style={{ border: 0 }}
          />
        </div>
      </fieldset>

      {/* Price */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">Price</legend>
        <input
          type="range"
          min={0}
          max={PRICE_MAX}
          step={5}
          value={priceMax}
          onChange={(e) => setPriceMax(Number(e.target.value))}
          className="w-full accent-[#baaae1]"
          aria-label="Maximum price"
        />
        <div className="mt-1 flex justify-between text-xs text-ink-soft">
          <span>$0</span>
          <span className="font-semibold text-[#8b76c2]">
            {priceMax >= PRICE_MAX ? "$160 Max" : `$${priceMax}`}
          </span>
        </div>
      </fieldset>

      {/* Who attends */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">Who attends</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PARTICIPATION_TAGS) as ParticipationType[]).map((k) => {
            const on = who.includes(k);
            return (
              <button
                key={k}
                type="button"
                onClick={() => setWho((s) => toggle(s, k))}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  on
                    ? "border-[#baaae1] bg-[#baaae1]/15 text-[#7c64b6]"
                    : "border-ink/15 bg-white text-ink-soft hover:border-ink/30"
                }`}
              >
                {PARTICIPATION_TAGS[k]}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* When (stacked — two date inputs won't fit side-by-side in the rail) */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">When</legend>
        <div className="space-y-2">
          <label className="block">
            <span className="mb-1 block text-xs text-ink-soft">From</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label="From date"
              className="block w-full min-w-0 rounded-lg border border-ink/15 bg-white px-2.5 py-2 text-sm text-ink outline-none focus:border-[#baaae1]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ink-soft">To</span>
            <input
              type="date"
              value={dateTo}
              min={date || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="To date"
              className="block w-full min-w-0 rounded-lg border border-ink/15 bg-white px-2.5 py-2 text-sm text-ink outline-none focus:border-[#baaae1]"
            />
          </label>
        </div>
      </fieldset>

      {/* Event style */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">Event style</legend>
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value as EventStyle | "")}
          className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-[#baaae1]"
        >
          <option value="">Any event style</option>
          {(Object.keys(EVENT_STYLE_LABELS) as EventStyle[]).map((k) => (
            <option key={k} value={k}>
              {EVENT_STYLE_LABELS[k]}
            </option>
          ))}
        </select>
      </fieldset>

      <button
        type="button"
        onClick={apply}
        className="w-full rounded-full py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: PURPLE }}
      >
        Apply Filters
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-24 rounded-2xl bg-lavender p-5">{form}</div>
      </aside>

      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-5 inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink lg:hidden"
      >
        <SlidersHorizontal size={16} /> Filters
      </button>

      {/* Mobile sheet */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-cream p-5">
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-lavender"
              >
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

/** Radio-style circular toggle to match the Figma "How you'll join" control. */
function CircleCheck({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className="flex w-full items-center gap-2.5 text-sm text-ink"
    >
      <span
        className={`grid h-[18px] w-[18px] place-items-center rounded-full border-2 transition ${
          checked ? "border-[#baaae1]" : "border-ink/25"
        }`}
      >
        {checked && <span className="h-2.5 w-2.5 rounded-full bg-[#baaae1]" />}
      </span>
      {label}
    </button>
  );
}
