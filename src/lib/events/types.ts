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
