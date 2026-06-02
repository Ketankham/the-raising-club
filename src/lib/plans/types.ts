// Shared plan types + tab presentation chrome + the DB-row → Plan mapper.
// The plan CARDS are DB-driven (admin-managed `plans` table); tab-level copy
// (labels, headings, the centers "all programs include" list) is presentation
// and stays here. Reads live in ./queries.ts (server-only).

export type Feature = { label: string; body: string };

export type PlanAudience = "caregiver" | "families" | "centers";
export type TabId = PlanAudience;

/**
 * Plan as consumed by the UI. `price` keeps the original union shape
 * (number dollars | "free" | "custom") so the marketing/settings components
 * barely change; the cents + seats + Stripe fields are added for billing.
 */
export type Plan = {
  id: string;
  key: string;
  audience: PlanAudience;
  name: string;
  price: number | "free" | "custom";
  unit?: string;
  customLabel?: string;
  badge?: string;
  subtitle?: string;
  description: string;
  cta: string;
  highlight?: boolean;
  features: Feature[];
  // Billing / entitlement extras:
  priceMonthlyCents: number | null;
  priceAnnualCents: number | null;
  adultSeats: number | null;
  staffSeats: number | null;
  stripePriceMonthlyId: string | null;
  stripePriceAnnualId: string | null;
  isActive: boolean;
  position: number;
};

export type Tab = {
  id: TabId;
  label: string;
  title: string;
  heading: { accent: string; rest: string };
  includes?: string[];
  includesNote?: string;
  plans: Plan[];
};

/** Per-audience presentation chrome (not editable data — pure marketing copy). */
export const TAB_META: Record<TabId, Omit<Tab, "plans">> = {
  caregiver: {
    id: "caregiver",
    label: "Caregiver",
    title: "Caregiver & Educator",
    heading: { accent: "Caregiver & Educator", rest: "memberships" },
  },
  families: {
    id: "families",
    label: "Families",
    title: "Family",
    heading: { accent: "Family", rest: "memberships" },
  },
  centers: {
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
  },
};

export const AUDIENCE_ORDER: TabId[] = ["caregiver", "families", "centers"];

/** Role → membership tab/audience. (admins never see plans.) */
export function tabForRole(role: string): TabId {
  if (role === "caregiver") return "caregiver";
  if (role === "organization") return "centers";
  return "families"; // parent
}

/** Raw row shape from the `plans` table (untyped query → mapped here). */
export type PlanRow = {
  id: string;
  key: string;
  audience: PlanAudience;
  name: string;
  badge: string | null;
  subtitle: string | null;
  description: string | null;
  cta: string | null;
  highlight: boolean;
  is_free: boolean;
  is_custom: boolean;
  custom_label: string | null;
  unit: string | null;
  price_monthly_cents: number | null;
  price_annual_cents: number | null;
  adult_seats: number | null;
  staff_seats: number | null;
  features: Feature[] | null;
  stripe_price_monthly_id: string | null;
  stripe_price_annual_id: string | null;
  is_active: boolean;
  position: number;
};

export function mapPlan(row: PlanRow): Plan {
  const price: Plan["price"] = row.is_free
    ? "free"
    : row.is_custom
      ? "custom"
      : Math.round((row.price_monthly_cents ?? 0) / 100);
  return {
    id: row.id,
    key: row.key,
    audience: row.audience,
    name: row.name,
    price,
    unit: row.unit ?? undefined,
    customLabel: row.custom_label ?? undefined,
    badge: row.badge ?? undefined,
    subtitle: row.subtitle ?? undefined,
    description: row.description ?? "",
    cta: row.cta ?? "Get Started",
    highlight: row.highlight,
    features: Array.isArray(row.features) ? row.features : [],
    priceMonthlyCents: row.price_monthly_cents,
    priceAnnualCents: row.price_annual_cents,
    adultSeats: row.adult_seats,
    staffSeats: row.staff_seats,
    stripePriceMonthlyId: row.stripe_price_monthly_id,
    stripePriceAnnualId: row.stripe_price_annual_id,
    isActive: row.is_active,
    position: row.position,
  };
}
