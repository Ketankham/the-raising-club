// Display helpers + shared taxonomy for the Marketplace UI.

import type { MarketplaceFilters } from "./types";

// Care Type = the filter-rail chips (Figma) — shared with course_care_type.
export type CareType = "home_family" | "small_groups" | "schools_centers";

export const CARE_TYPE_LABELS: Record<CareType, string> = {
  home_family: "Home & Family",
  small_groups: "Small Groups",
  schools_centers: "Schools & Centers",
};

export const CARE_TYPES = Object.keys(CARE_TYPE_LABELS) as CareType[];

// Caregiver care_setting → Care Type bucket (caregivers store the finer
// care_setting enum; the filter rail uses the 3 broad Care Types).
const CARE_SETTING_TO_TYPE: Record<string, CareType> = {
  one_child_family: "home_family",
  multi_children_family: "home_family",
  nanny_share: "home_family",
  live_in: "home_family",
  tutoring_enrichment: "small_groups",
  group_center: "schools_centers",
};

export function careSettingsToTypes(settings: string[]): CareType[] {
  const out = new Set<CareType>();
  for (const s of settings) {
    const t = CARE_SETTING_TO_TYPE[s];
    if (t) out.add(t);
  }
  return [...out];
}

// Schedule window labels (the 📅 chips on family/job cards).
export const SCHEDULE_LABELS: Record<string, string> = {
  mornings: "Mornings",
  afternoons: "Afternoons",
  evenings: "Evenings",
  weekdays: "Weekdays",
  weekends: "Weekends",
  overnight: "Overnight",
  flexible: "Flexible",
};

// "Open to" chips on a family card.
export const OPEN_TO_LABELS: Record<string, string> = {
  playdates: "Playdates",
  nanny_share: "Nanny share",
  co_hire: "Co-hire",
  meet_families: "Meet families",
};

// Age-group enum → short tag (card) and a months range (for the slider filter).
export const AGE_GROUP_TAGS: Record<string, string> = {
  infant: "Infants",
  toddler: "Toddlers",
  preschool: "Preschool",
  school_age: "School-age",
  older_child: "Older kids",
  preteen: "Preteens",
  teen: "Teens",
};

const AGE_GROUP_MONTHS: Record<string, [number, number]> = {
  infant: [0, 12],
  toddler: [12, 36],
  preschool: [36, 60],
  school_age: [60, 120],
  older_child: [96, 144],
  preteen: [132, 180],
  teen: [156, 216],
};

// Experience level → compact card label.
export const EXPERIENCE_SHORT: Record<string, string> = {
  just_starting: "New",
  lt_1_year: "<1 yr exp",
  "1_3_years": "1–3 yrs exp",
  "3_5_years": "3–5 yrs exp",
  "5_10_years": "5–10 yrs exp",
  "10_plus_years": "10+ yrs exp",
};

/** "$28/hr" or "$18–$26/hr" budget/rate label. */
export function moneyRange(
  min: number | null,
  max: number | null,
  unit = "hour",
): string | null {
  const u = unit === "hour" ? "/hr" : `/${unit}`;
  const f = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(0)}`;
  if (min != null && max != null && min !== max) return `${f(min)}–${f(max)}${u}`;
  const one = min ?? max;
  if (one != null) return `${f(one)}${u}`;
  return null;
}

export function caregiverName(c: {
  preferredName: string | null;
  firstName: string | null;
  lastInitial: string;
}): string {
  const first = c.preferredName || c.firstName || "Caregiver";
  return c.lastInitial ? `${first} ${c.lastInitial}.` : first;
}

/** True when the caregiver/family age coverage overlaps the slider window. */
export function ageGroupsOverlapMonths(
  groups: string[],
  selMin?: number,
  selMax?: number,
): boolean {
  if (selMin == null && selMax == null) return true;
  const lo = selMin ?? 0;
  const hi = selMax ?? Number.MAX_SAFE_INTEGER;
  if (!groups.length) return true; // no stated ages → don't exclude
  return groups.some((g) => {
    const r = AGE_GROUP_MONTHS[g];
    if (!r) return false;
    return r[0] <= hi && r[1] >= lo;
  });
}

/** Parse the shared filter-rail params from the URL. */
export function parseMarketplaceFilters(sp: Record<string, string | string[] | undefined>): MarketplaceFilters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const list = (v: string | string[] | undefined): string[] =>
    !v ? [] : Array.isArray(v) ? v : v.split(",").filter(Boolean);
  const num = (v: string | string[] | undefined) => {
    const n = Number(one(v));
    return Number.isFinite(n) ? n : undefined;
  };
  const careTypes = list(sp.care).filter((c): c is CareType => CARE_TYPES.includes(c as CareType));
  return {
    q: one(sp.q) || undefined,
    careTypes: careTypes.length ? careTypes : undefined,
    ageMin: num(sp.ageMin),
    ageMax: num(sp.ageMax),
    where: one(sp.where) || undefined,
    verifiedOnly: one(sp.verified) === "1" || undefined,
    backgroundCheckedOnly: one(sp.bgcheck) === "1" || undefined,
  };
}
