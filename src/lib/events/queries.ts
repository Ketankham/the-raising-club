import { createClient } from "@/lib/supabase/server";
import type {
  EventDetail,
  EventFilters,
  EventJoinMode,
  EventListItem,
  EventSession,
  EventStyle,
  MyRegistration,
  ParticipationType,
  RegistrationContext,
} from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function pickNextSession(rows: any[]): EventSession | null {
  const now = Date.now();
  const sessions = (rows ?? [])
    .map((s) => ({ id: s.id, startsAt: s.starts_at, endsAt: s.ends_at }))
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  // prefer the next upcoming session; fall back to the most recent one
  return sessions.find((s) => +new Date(s.startsAt) >= now) ?? sessions[sessions.length - 1] ?? null;
}

function mapRow(row: any, savedIds: Set<string>): EventListItem {
  const loc = (row.event_locations ?? [])[0];
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    heroImageUrl: row.hero_image_url,
    joinMode: row.join_mode,
    style: row.style,
    participationType: row.participation_type,
    ageMinMonths: row.age_min_months,
    ageMaxMonths: row.age_max_months,
    priceModel: row.price_model,
    priceCents: row.price_cents,
    currency: row.currency,
    isFeatured: row.is_featured,
    nextSession: pickNextSession(row.event_sessions),
    location: loc
      ? { kind: loc.kind, neighborhood: loc.neighborhood, address: loc.address }
      : null,
    isSaved: savedIds.has(row.id),
  };
}

/** Ranges overlap when each starts before the other ends (null = unbounded). */
function ageOverlaps(
  evMin: number | null,
  evMax: number | null,
  selMin?: number,
  selMax?: number,
): boolean {
  if (selMin == null && selMax == null) return true;
  const lo = selMin ?? 0;
  const hi = selMax ?? Number.MAX_SAFE_INTEGER;
  const eLo = evMin ?? 0;
  const eHi = evMax ?? Number.MAX_SAFE_INTEGER;
  return eLo <= hi && eHi >= lo;
}

function matchesFilters(item: EventListItem, f: EventFilters): boolean {
  if (f.q) {
    const q = f.q.toLowerCase();
    const hay = `${item.title} ${item.summary ?? ""}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (!ageOverlaps(item.ageMinMonths, item.ageMaxMonths, f.ageMin, f.ageMax)) return false;
  if (f.joinModes?.length) {
    const ok = item.joinMode === "hybrid" || f.joinModes.includes(item.joinMode);
    if (!ok) return false;
  }
  if (f.whoAttends?.length && !f.whoAttends.includes(item.participationType)) return false;
  if (f.styles?.length && (!item.style || !f.styles.includes(item.style))) return false;
  if (f.priceMax != null) {
    const free = item.priceModel === "included" || item.priceCents === 0;
    if (!free && item.priceCents > f.priceMax * 100) return false;
  }
  if (f.date) {
    const from = new Date(`${f.date}T00:00:00`).getTime();
    const hasOnOrAfter =
      item.nextSession != null && +new Date(item.nextSession.startsAt) >= from;
    if (!hasOnOrAfter) return false;
  }
  return true;
}

/**
 * List published, public events. RLS allows anonymous reads of published+public
 * rows, so this works signed-out. Filtering beyond status/visibility is done in
 * JS for now (age-overlap, who-attends, etc.) — fine at current volumes; can be
 * pushed into SQL later if the catalog grows.
 */
export async function listEvents(filters: EventFilters = {}): Promise<EventListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(
      `id, slug, title, summary, hero_image_url, join_mode, style, participation_type,
       age_min_months, age_max_months, price_model, price_cents, currency, is_featured,
       status, visibility,
       event_sessions ( id, starts_at, ends_at ),
       event_locations ( kind, neighborhood, address )`,
    )
    .eq("status", "published")
    .eq("visibility", "public");

  if (error || !data) return [];

  // Saved-event ids for the current user (empty when signed out).
  const savedIds = new Set<string>();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: saves } = await supabase
      .from("event_saves")
      .select("event_id")
      .eq("user_id", user.id);
    for (const s of saves ?? []) savedIds.add((s as any).event_id);
  }

  const items = data.map((row) => mapRow(row, savedIds)).filter((it) => matchesFilters(it, filters));

  // Featured first, then soonest upcoming session.
  items.sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
    const at = a.nextSession ? +new Date(a.nextSession.startsAt) : Infinity;
    const bt = b.nextSession ? +new Date(b.nextSession.startsAt) : Infinity;
    return at - bt;
  });

  return items;
}

/** Full event for the detail page. RLS returns the row if it's public+published
 *  or the caller can manage it. Returns null if not found / not visible. */
export async function getEventBySlug(slug: string): Promise<EventDetail | null> {
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("events")
    .select(
      `id, slug, title, summary, what_to_expect, hero_image_url, join_mode, style,
       participation_type, age_min_months, age_max_months, price_model, price_cents,
       currency, is_featured, timezone, requires_approval, cancellation_cutoff_hours,
       child_capacity, agenda, status, visibility,
       event_sessions ( id, starts_at, ends_at ),
       event_locations ( kind, neighborhood, address, arrival_notes, platform, join_url, join_instructions ),
       event_instructors ( id, name, bio, avatar_url, role_label ),
       event_resources ( id, label, url, file_path, kind )`,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!row) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isSaved = false;
  if (user) {
    const { data: save } = await supabase
      .from("event_saves")
      .select("event_id")
      .eq("user_id", user.id)
      .eq("event_id", row.id)
      .maybeSingle();
    isSaved = !!save;
  }

  let confirmedChildCount = 0;
  const { data: count } = await supabase.rpc("event_confirmed_child_count", {
    target_event: row.id,
  });
  if (typeof count === "number") confirmedChildCount = count;

  const loc = (row.event_locations ?? [])[0];

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    heroImageUrl: row.hero_image_url,
    joinMode: row.join_mode,
    style: row.style,
    participationType: row.participation_type,
    ageMinMonths: row.age_min_months,
    ageMaxMonths: row.age_max_months,
    priceModel: row.price_model,
    priceCents: row.price_cents,
    currency: row.currency,
    isFeatured: row.is_featured,
    nextSession: pickNextSession(row.event_sessions),
    location: loc
      ? { kind: loc.kind, neighborhood: loc.neighborhood, address: loc.address }
      : null,
    isSaved,
    whatToExpect: row.what_to_expect,
    agenda: Array.isArray(row.agenda) ? row.agenda : [],
    timezone: row.timezone,
    requiresApproval: row.requires_approval,
    cancellationCutoffHours: row.cancellation_cutoff_hours,
    childCapacity: row.child_capacity,
    confirmedChildCount,
    sessions: (row.event_sessions ?? [])
      .map((s: any) => ({ id: s.id, startsAt: s.starts_at, endsAt: s.ends_at }))
      .sort((a: EventSession, b: EventSession) => +new Date(a.startsAt) - +new Date(b.startsAt)),
    locationFull: loc
      ? {
          kind: loc.kind,
          neighborhood: loc.neighborhood,
          address: loc.address,
          arrivalNotes: loc.arrival_notes,
          platform: loc.platform,
          joinUrl: loc.join_url,
          joinInstructions: loc.join_instructions,
        }
      : null,
    instructors: (row.event_instructors ?? []).map((i: any) => ({
      id: i.id,
      name: i.name,
      bio: i.bio,
      avatarUrl: i.avatar_url,
      roleLabel: i.role_label,
    })),
    resources: (row.event_resources ?? []).map((r: any) => ({
      id: r.id,
      label: r.label,
      url: r.url,
      filePath: r.file_path,
      kind: r.kind,
    })),
  };
}

/** The current user's active (non-cancelled) registration for an event, if any. */
export async function getMyRegistration(eventId: string): Promise<MyRegistration | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("event_registrations")
    .select("id, status")
    .eq("event_id", eventId)
    .eq("registrant_user_id", user.id)
    .not("status", "in", "(cancelled,denied)")
    .maybeSingle();

  return data ? { id: data.id, status: data.status } : null;
}

/**
 * Context for the registration wizard. Assumes the caller already ensured a
 * signed-in user (the page redirects guests to sign-in). Loads the event basics,
 * the user's saved children, and the event's required waivers.
 */
export async function getRegistrationContext(slug: string): Promise<RegistrationContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: ev } = await supabase
    .from("events")
    .select(
      `id, slug, title, hero_image_url, participation_type, price_model, price_cents,
       currency, requires_approval, age_min_months, age_max_months,
       event_waivers ( waivers ( id, kind, title, body ) )`,
    )
    .eq("slug", slug)
    .maybeSingle();
  if (!ev) return null;

  const [{ data: kids }, { data: profile }] = await Promise.all([
    supabase
      .from("children")
      .select("id, pet_name, birth_month, birth_year")
      .eq("parent_user_id", user.id)
      .order("position"),
    supabase.from("profiles").select("email").eq("id", user.id).maybeSingle(),
  ]);

  const waivers = (ev.event_waivers ?? [])
    .map((ew: any) => ew.waivers)
    .filter(Boolean)
    .map((w: any) => ({ id: w.id, kind: w.kind, title: w.title, body: w.body }));

  return {
    eventId: ev.id,
    slug: ev.slug,
    title: ev.title,
    heroImageUrl: ev.hero_image_url,
    participationType: ev.participation_type,
    priceModel: ev.price_model,
    priceCents: ev.price_cents,
    currency: ev.currency,
    requiresApproval: ev.requires_approval,
    ageMinMonths: ev.age_min_months,
    ageMaxMonths: ev.age_max_months,
    contactEmail: profile?.email ?? user.email ?? null,
    children: (kids ?? []).map((k: any) => ({
      id: k.id,
      petName: k.pet_name,
      birthMonth: k.birth_month,
      birthYear: k.birth_year,
    })),
    waivers,
  };
}

/** Parse the /events URL search params into typed filters. */
export function parseFilters(sp: Record<string, string | string[] | undefined>): EventFilters {
  const one = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const num = (k: string) => {
    const v = one(k);
    if (v == null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const list = <T extends string>(k: string): T[] | undefined => {
    const v = one(k);
    if (!v) return undefined;
    return v.split(",").filter(Boolean) as T[];
  };

  return {
    q: one("q") || undefined,
    ageMin: num("ageMin"),
    ageMax: num("ageMax"),
    joinModes: list<EventJoinMode>("join"),
    priceMax: num("priceMax"),
    whoAttends: list<ParticipationType>("who"),
    styles: list<EventStyle>("style"),
    date: one("date") || undefined,
  };
}
