/** Shared label maps for caregiver enum values (used by the profile + edits). */

export const AGE_GROUPS: Record<string, string> = {
  infant: "Infants (0–12 mo)",
  toddler: "Toddlers (1–3 yrs)",
  preschool: "Preschool (3–5 yrs)",
  school_age: "School-age (5+)",
  older_child: "Older children (8–12)",
  preteen: "Middle school (11+)",
  teen: "Teens (13–18)",
};

export const CARE_SETTINGS: Record<string, string> = {
  one_child_family: "One child in a family",
  multi_children_family: "Two+ children in a family",
  nanny_share: "Nanny share",
  live_in: "Live-in care",
  tutoring_enrichment: "Tutoring / learning pods",
  group_center: "Group care in centers or programs",
};

export const EXPERIENCE_TYPES: Record<string, { label: string; sub: string; icon: string }> = {
  own_family: { label: "Caring for children in my own family", sub: "Family caregiving", icon: "👨‍👩‍👧" },
  babysitting: { label: "Babysitting for families", sub: "Occasional or short-term care", icon: "🧸" },
  nannying: { label: "Nannying for families", sub: "Ongoing care with regular responsibilities and routines", icon: "👶" },
  daycare_preschool: { label: "Working in a daycare or preschool", sub: "Group setting", icon: "🏫" },
  afterschool_enrichment: { label: "After-school or enrichment programs", sub: "Programs and activities", icon: "🎨" },
  teaching_tutoring: { label: "Teaching, tutoring, or supporting learning", sub: "One-on-one and learning pods", icon: "📚" },
  other: { label: "Other caregiving or child-related work", sub: "", icon: "🌿" },
};

export const EXPERIENCE_LEVELS: Record<string, string> = {
  just_starting: "Just getting started",
  lt_1_year: "Less than 1 year",
  "1_3_years": "1–3 years",
  "3_5_years": "3–5 years",
  "5_10_years": "5–10 years",
  "10_plus_years": "10+ years",
};

export const AVAILABILITY_TYPES: Record<string, string> = {
  full_time: "Full-time roles",
  part_time: "Part-time roles",
  occasional_backup: "Occasional or backup care",
  flexible: "Flexible / open schedule",
};

export const AVAILABILITY_WINDOWS: Record<string, string> = {
  mornings: "Mornings",
  afternoons: "Afternoons",
  evenings: "Evenings",
  occasional_overnight: "Occasional overnights",
  routine_overnight: "Routine overnights",
  weekends: "Weekends",
  flexible: "Flexible / variable",
};

export const AVAILABILITY_OPENNESS: Record<string, string> = {
  travel_us: "Open to traveling within the U.S.",
  travel_intl: "Open to traveling internationally",
  multiple_locations: "Open to multiple family locations",
  short_term: "Open to short-term roles",
  long_term: "Open to long-term roles",
};

export const EDUCATION_LEVELS: Record<string, string> = {
  high_school: "High school",
  some_college: "Some college",
  associate: "Associate degree",
  bachelor: "Bachelor's degree",
  graduate: "Graduate degree",
  prefer_not_to_say: "Prefer not to say",
};

export const optionList = (map: Record<string, string>) =>
  Object.entries(map).map(([value, label]) => ({ value, label }));
