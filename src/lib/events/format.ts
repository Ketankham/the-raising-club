// Display helpers for events. Copy rules come straight from the master doc:
//   - age range uses an EN-DASH ("–"), not "to"
//   - "$0" is shown as "Included" (never "Free")
//   - date/time like "Saturday, January 24 · 9:00–10:30 AM"
import type { EventListItem, PriceModel } from "./types";

/** "6 months", "3 years", "2.5 years" from a month count. */
export function ageLabel(months: number): string {
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = months / 12;
  const rounded = Number.isInteger(years) ? years : Math.round(years * 10) / 10;
  return `${rounded} year${rounded === 1 ? "" : "s"}`;
}

/** "6 months – 3 years", "All ages", "Up to 3 years", "5+ years". */
export function ageRangeLabel(min: number | null, max: number | null): string {
  if (min == null && max == null) return "All ages";
  if (min != null && max == null) return `${ageLabel(min)}+`;
  if (min == null && max != null) return `Up to ${ageLabel(max)}`;
  return `${ageLabel(min!)} – ${ageLabel(max!)}`; // en-dash
}

/** "Included" / "$45" / "Pay what you can". */
export function priceLabel(model: PriceModel, cents: number, currency = "usd"): string {
  if (model === "included" || cents === 0) return "Included";
  if (model === "donation") return "Pay what you can";
  const amount = cents / 100;
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  });
  return fmt.format(amount);
}

/** "Saturday, January 24 · 9:00–10:30 AM" (en-dash between times). */
export function sessionDateTimeLabel(startsAt: string, endsAt?: string | null, timeZone?: string): string {
  const start = new Date(startsAt);
  const datePart = start.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone,
  });
  const startTime = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
  if (!endsAt) return `${datePart} · ${startTime}`;
  const end = new Date(endsAt);
  const endTime = end.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
  return `${datePart} · ${startTime}–${endTime}`;
}

/** Short date for cards: "Feb 21, 2026". */
export function shortDateLabel(startsAt: string, timeZone?: string): string {
  return new Date(startsAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone,
  });
}

// --- Timezone conversion (admin form <-> stored UTC instant) ----------------
// `<input type="datetime-local">` gives a naive wall-clock ("2026-05-09T10:00").
// We interpret that wall-clock in the event's timezone and store the true UTC
// instant, so it displays correctly in any viewer's local timezone.

/** Offset (ms) of `timeZone` from UTC at the given instant (DST-aware). */
function tzOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p = dtf.formatToParts(date).reduce<Record<string, string>>((a, x) => {
    a[x.type] = x.value;
    return a;
  }, {});
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUTC - date.getTime();
}

/** Wall-clock ("2026-05-09T10:00") in `timeZone` -> UTC ISO instant. */
export function wallClockToUtc(wallClock: string, timeZone: string): string | null {
  if (!wallClock) return null;
  const naive = new Date(`${wallClock.slice(0, 16)}:00Z`); // digits as if UTC
  if (Number.isNaN(naive.getTime())) return null;
  const offset = tzOffsetMs(naive, timeZone);
  return new Date(naive.getTime() - offset).toISOString();
}

/** UTC ISO instant -> wall-clock ("2026-05-09T10:00") in `timeZone`. */
export function utcToWallClock(iso: string | null | undefined, timeZone: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
    .formatToParts(d)
    .reduce<Record<string, string>>((a, x) => {
      a[x.type] = x.value;
      return a;
    }, {});
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** "Online" | "Brooklyn" | "In-person" — neighborhood first per the doc. */
export function locationLabel(loc: EventListItem["location"]): string {
  if (!loc) return "";
  if (loc.kind === "digital") return "Online";
  return loc.neighborhood || loc.address || "In-person";
}
