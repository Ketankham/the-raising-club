// Single source of truth for the membership plan catalog.
// Consumed by the public marketing page (src/components/membership/membership.tsx)
// and the account Settings page (src/lib/settings/*, src/components/settings/*).
//
// Each plan carries a stable `key` that is persisted to profiles.plan_key when a
// user selects it. Keys are never renamed once shipped (they live in the DB).

export type Feature = { label: string; body: string };

export type Plan = {
  key: string;
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

export type TabId = "caregiver" | "families" | "centers";

export type Tab = {
  id: TabId;
  label: string;
  title: string; // e.g. "Caregiver & Educator"
  // Centered page heading, split so the first part renders in serif italic.
  heading: { accent: string; rest: string };
  includes?: string[];
  includesNote?: string;
  plans: Plan[];
};

export const TABS: Tab[] = [
  {
    id: "caregiver",
    label: "Caregiver",
    title: "Caregiver & Educator",
    heading: { accent: "Caregiver & Educator", rest: "memberships" },
    plans: [
      {
        key: "trc_community",
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
        key: "trc_pro_caregiver",
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
        key: "trc_lead_caregiver",
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
        key: "family_essentials",
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
        key: "family_access",
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
        key: "family_club_plus",
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
        key: "program_core",
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
        key: "program_growth",
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
        key: "program_partner",
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

/** Role → membership tab. (admins never see plans.) */
export function tabForRole(role: string): TabId {
  if (role === "caregiver") return "caregiver";
  if (role === "organization") return "centers";
  return "families"; // parent
}

/** The plans available to a given role, in display order. */
export function plansForRole(role: string): Plan[] {
  return TABS.find((t) => t.id === tabForRole(role))?.plans ?? [];
}

/** Look up a plan by its stable key (across all roles). */
export function planByKey(key: string | null | undefined): Plan | null {
  if (!key) return null;
  for (const tab of TABS) {
    const found = tab.plans.find((p) => p.key === key);
    if (found) return found;
  }
  return null;
}

/** The free starter plan key for a role (the plan a user is on when plan_key is null). */
export function freePlanForRole(role: string): Plan | null {
  return plansForRole(role).find((p) => p.price === "free") ?? null;
}
