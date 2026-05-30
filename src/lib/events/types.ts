// Domain types for the Events feature. Mirrors the DB enums/tables in
// supabase/migrations/0013-0015. DB type generation is blocked (needs Docker),
// so queries stay untyped and map into these hand-written types (same pattern
// as lib/profile.ts).

export type EventJoinMode = "online" | "in_person" | "hybrid";
export type EventStyle = "guided_class" | "open_play" | "workshop" | "ongoing_series";
export type ParticipationType = "children_with_adult" | "children_dropoff" | "adults_only";
export type EventStatus = "draft" | "published" | "full" | "cancelled" | "completed" | "archived";
export type EventVisibility = "public" | "private";
export type PriceModel = "included" | "paid" | "donation";

export interface EventSession {
  id: string;
  startsAt: string; // ISO
  endsAt: string; // ISO
}

export interface EventLocationSummary {
  kind: "physical" | "digital";
  neighborhood: string | null;
  address: string | null;
}

/** Shape used by the list/grid cards. */
export interface EventListItem {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  heroImageUrl: string | null;
  joinMode: EventJoinMode;
  style: EventStyle | null;
  participationType: ParticipationType;
  ageMinMonths: number | null;
  ageMaxMonths: number | null;
  priceModel: PriceModel;
  priceCents: number;
  currency: string;
  isFeatured: boolean;
  nextSession: EventSession | null;
  location: EventLocationSummary | null;
  isSaved: boolean;
}

/** Filters parsed from the URL search params on /events. */
export interface EventFilters {
  q?: string;
  /** child age window in MONTHS */
  ageMin?: number;
  ageMax?: number;
  joinModes?: EventJoinMode[];
  priceMax?: number; // dollars
  whoAttends?: ParticipationType[];
  styles?: EventStyle[];
  /** ISO date (yyyy-mm-dd) — events with a session on/after this day */
  date?: string;
}

export const PARTICIPATION_LABELS: Record<ParticipationType, string> = {
  children_with_adult: "Children with adults (all ages)",
  children_dropoff: "Children independently (drop-off)",
  adults_only: "Adults (no children)",
};

export const PARTICIPATION_TAGS: Record<ParticipationType, string> = {
  children_with_adult: "Children + Adult",
  children_dropoff: "Children only",
  adults_only: "Adults only",
};

export const EVENT_STYLE_LABELS: Record<EventStyle, string> = {
  guided_class: "Guided class",
  open_play: "Open play",
  workshop: "Workshop",
  ongoing_series: "Ongoing series",
};

// --- Detail page -----------------------------------------------------------

export interface AgendaBlock {
  time?: string;
  title: string;
  description?: string;
}

export interface EventInstructor {
  id: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  roleLabel: string | null;
}

export interface EventResourceItem {
  id: string;
  label: string;
  url: string | null;
  filePath: string | null;
  kind: string;
}

export interface EventLocationFull {
  kind: "physical" | "digital";
  neighborhood: string | null;
  address: string | null;
  arrivalNotes: string | null;
  platform: string | null;
  joinUrl: string | null;
  joinInstructions: string | null;
}

export interface EventDetail extends EventListItem {
  whatToExpect: string | null;
  agenda: AgendaBlock[];
  timezone: string;
  requiresApproval: boolean;
  cancellationCutoffHours: number;
  childCapacity: number | null;
  confirmedChildCount: number;
  sessions: EventSession[];
  locationFull: EventLocationFull | null;
  instructors: EventInstructor[];
  resources: EventResourceItem[];
}

export interface MyRegistration {
  id: string;
  status: string;
}

/** Full registration for the "Your registration" / "Payments" tabs (Detail B). */
export interface RegisteredChild {
  id: string;
  petName: string | null;
  birthMonth: number | null;
  birthYear: number | null;
  supportNeeds: SupportNeed[];
}

export interface RegistrationDetails {
  id: string;
  status: string;
  registeredAt: string;
  qrToken: string;
  contactEmail: string | null;
  contactPhone: string | null;
  children: RegisteredChild[];
  waiverAcceptances: { kind: string; mediaConsent: string }[];
  emergencyContact: { name: string; phone: string; relationship: string | null } | null;
  pickup: { name: string; phone: string; relationship: string | null } | null;
  payment: {
    amountCents: number;
    currency: string;
    status: string;
    receiptUrl: string | null;
    refundedAmountCents: number;
  } | null;
  /** Whether the cancellation cutoff still allows self-cancel (computed server-side). */
  canCancel: boolean;
}

// --- Registration flow -----------------------------------------------------

export type SupportNeed =
  | "sensory"
  | "allergies"
  | "communication_learning"
  | "medical_physical"
  | "prefer_not_to_say"
  | "other";

export const SUPPORT_NEED_LABELS: Record<SupportNeed, string> = {
  sensory: "Sensory sensitivities (noise, lights, textures, crowds)",
  allergies: "Food or environmental allergies",
  communication_learning: "Communication or learning differences",
  medical_physical: "Medical or physical support needs",
  prefer_not_to_say: "Prefer not to share",
  other: "Other",
};

export interface ChildOption {
  id: string;
  petName: string | null;
  birthMonth: number | null;
  birthYear: number | null;
}

export interface WaiverItem {
  id: string;
  kind: "participation" | "media_release";
  title: string;
  body: string;
}

export interface RegistrationContext {
  eventId: string;
  slug: string;
  title: string;
  heroImageUrl: string | null;
  participationType: ParticipationType;
  priceModel: PriceModel;
  priceCents: number;
  currency: string;
  requiresApproval: boolean;
  ageMinMonths: number | null;
  ageMaxMonths: number | null;
  contactEmail: string | null;
  children: ChildOption[];
  waivers: WaiverItem[];
}

/** Create/edit payload for the admin event form. */
export interface EventFormInput {
  id?: string;
  orgId?: string | null;
  title: string;
  summary?: string;
  whatToExpect?: string;
  heroImageUrl?: string;
  joinMode: EventJoinMode;
  style?: EventStyle | null;
  participationType: ParticipationType;
  ageMinMonths?: number | null;
  ageMaxMonths?: number | null;
  priceModel: PriceModel;
  priceCents: number;
  childCapacity?: number | null;
  adultCapacity?: number | null;
  visibility: EventVisibility;
  status: EventStatus;
  requiresApproval: boolean;
  waitlistEnabled: boolean;
  isFeatured: boolean;
  timezone: string;
  startsAt?: string | null;
  endsAt?: string | null;
  location: {
    kind: "physical" | "digital";
    neighborhood?: string;
    address?: string;
    arrivalNotes?: string;
    platform?: string;
    joinUrl?: string;
  };
  /** External link resources (max 5). */
  resources: { label: string; url: string; kind: string }[];
  instructors: { name: string; roleLabel?: string; bio?: string; avatarUrl?: string }[];
}

/** Payload submitted at the end of the registration wizard. */
export interface RegistrationPayload {
  eventId: string;
  adultCount: number;
  contactEmail: string;
  contactPhone?: string;
  children: {
    childId?: string;
    petName?: string;
    birthMonth: number;
    birthYear: number;
  }[];
  supportNeeds: SupportNeed[];
  supportNote?: string;
  emergencyContact?: { name: string; phone: string; relationship?: string };
  pickup?: { name: string; phone: string; relationship?: string };
  waiverAcceptances: { waiverId: string; mediaConsent?: "granted" | "declined" }[];
}
