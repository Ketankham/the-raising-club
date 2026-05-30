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

/** "Online" | "Brooklyn" | "In-person" — neighborhood first per the doc. */
export function locationLabel(loc: EventListItem["location"]): string {
  if (!loc) return "";
  if (loc.kind === "digital") return "Online";
  return loc.neighborhood || loc.address || "In-person";
}
