"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { ageLabel } from "@/lib/events/format";
import {
  EVENT_STYLE_LABELS,
  PARTICIPATION_LABELS,
  type EventFilters,
  type EventJoinMode,
  type EventStyle,
  type ParticipationType,
} from "@/lib/events/types";

const AGE_MAX = 144; // 12 years, in months
const PRICE_MAX = 160;
const JOIN_OPTIONS: { value: EventJoinMode; label: string }[] = [
  { value: "online", label: "Online" },
  { value: "in_person", label: "In-Person" },
];

function toggle<T>(set: T[], value: T): T[] {
  return set.includes(value) ? set.filter((v) => v !== value) : [...set, value];
}

export function EventsFilters({ initial }: { initial: EventFilters }) {
  const [open, setOpen] = useState(false); // mobile sheet
  const router = useRouter();

  const [ageMax, setAgeMax] = useState(initial.ageMax ?? AGE_MAX);
  const [priceMax, setPriceMax] = useState(initial.priceMax ?? PRICE_MAX);
  const [join, setJoin] = useState<EventJoinMode[]>(initial.joinModes ?? []);
  const [who, setWho] = useState<ParticipationType[]>(initial.whoAttends ?? []);
  const [styles, setStyles] = useState<EventStyle[]>(initial.styles ?? []);
  const [date, setDate] = useState(initial.date ?? "");

  function apply() {
    const p = new URLSearchParams();
    if (initial.q) p.set("q", initial.q); // keep any active search
    if (ageMax < AGE_MAX) p.set("ageMax", String(ageMax));
    if (priceMax < PRICE_MAX) p.set("priceMax", String(priceMax));
    if (join.length) p.set("join", join.join(","));
    if (who.length) p.set("who", who.join(","));
    if (styles.length) p.set("style", styles.join(","));
    if (date) p.set("date", date);
    const qs = p.toString();
    router.push(qs ? `/events?${qs}` : "/events");
    setOpen(false);
  }

  function clearAll() {
    setAgeMax(AGE_MAX);
    setPriceMax(PRICE_MAX);
    setJoin([]);
    setWho([]);
    setStyles([]);
    setDate("");
    router.push("/events");
    setOpen(false);
  }

  const form = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-ink">Filters</h2>
        <button
          type="button"
          onClick={clearAll}
          className="text-sm font-semibold text-[#7ba84f] hover:underline"
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
          className="w-full accent-[#9cc766]"
          aria-label="Maximum child age in months"
        />
        <div className="mt-1 flex justify-between text-xs text-ink-soft">
          <span>All months</span>
          <span>{ageMax >= AGE_MAX ? "12 years" : `up to ${ageLabel(ageMax)}`}</span>
        </div>
      </fieldset>

      {/* How you'll join */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">How you&apos;ll join</legend>
        <div className="space-y-2">
          {JOIN_OPTIONS.map((o) => (
            <Check
              key={o.value}
              label={o.label}
              checked={join.includes(o.value)}
              onChange={() => setJoin((s) => toggle(s, o.value))}
            />
          ))}
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
          className="w-full accent-[#9cc766]"
          aria-label="Maximum price"
        />
        <div className="mt-1 flex justify-between text-xs text-ink-soft">
          <span>$0</span>
          <span>{priceMax >= PRICE_MAX ? "$160 Max" : `$${priceMax}`}</span>
        </div>
        <p className="mt-1 text-xs text-ink-soft/80">
          Some events are community-hosted or member-included.
        </p>
      </fieldset>

      {/* Who attends */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">Who attends</legend>
        <div className="space-y-2">
          {(Object.keys(PARTICIPATION_LABELS) as ParticipationType[]).map((k) => (
            <Check
              key={k}
              label={PARTICIPATION_LABELS[k]}
              checked={who.includes(k)}
              onChange={() => setWho((s) => toggle(s, k))}
            />
          ))}
        </div>
      </fieldset>

      {/* Event style */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">Event style</legend>
        <div className="space-y-2">
          {(Object.keys(EVENT_STYLE_LABELS) as EventStyle[]).map((k) => (
            <Check
              key={k}
              label={EVENT_STYLE_LABELS[k]}
              checked={styles.includes(k)}
              onChange={() => setStyles((s) => toggle(s, k))}
            />
          ))}
        </div>
      </fieldset>

      {/* When */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">When</legend>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
        />
      </fieldset>

      <button
        type="button"
        onClick={apply}
        className="w-full rounded-full bg-[#9cc766] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8bb957]"
      >
        Apply Filters
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-24 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          {form}
        </div>
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

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded accent-[#9cc766]"
      />
      {label}
    </label>
  );
}
