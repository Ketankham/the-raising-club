// Display helpers for the learner-facing course screens.

/** "6 months", "3 years" from a month count. */
export function ageLabel(months: number): string {
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = months / 12;
  const rounded = Number.isInteger(years) ? years : Math.round(years * 10) / 10;
  return `${rounded} year${rounded === 1 ? "" : "s"}`;
}

/** "6 months – 3 years", "All ages", "Up to 3 years", "5+ years" (en-dash). */
export function ageRangeLabel(min: number | null, max: number | null): string {
  if (min == null && max == null) return "All ages";
  if (min != null && max == null) return `${ageLabel(min)}+`;
  if (min == null && max != null) return `Up to ${ageLabel(max)}`;
  return `${ageLabel(min!)} – ${ageLabel(max!)}`;
}

/** "Free" / "$49". Courses are free for now; price fields exist for later. */
export function coursePriceLabel(isFree: boolean, cents: number, currency = "usd"): string {
  if (isFree || cents === 0) return "Free";
  const amount = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function compareAtLabel(cents: number | null, currency = "usd"): string | null {
  if (!cents) return null;
  const amount = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/** "45 min", "2h", "2h 15m" from minutes. */
export function durationLabel(minutes: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** "Feb 21, 2026". */
export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
