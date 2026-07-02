import { createClient } from "@/lib/supabase/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ManagedEventRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  visibility: string;
  isFeatured: boolean;
  priceModel: string;
  priceCents: number;
  childCapacity: number | null;
  nextStartsAt: string | null;
  registrationCount: number;
  orgName: string | null;
  createdBy: string | null;
}

/** Events the current user manages (admins see all; org admins see their orgs'). */
export async function listManagedEvents(opts: {
  isAdmin: boolean;
  orgIds: string[];
  userId: string;
}): Promise<ManagedEventRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select(
      `id, slug, title, status, visibility, is_featured, price_model, price_cents,
       child_capacity, org_id, created_by,
       event_sessions ( starts_at ),
       event_registrations ( id, status ),
       organizations ( name ),
       profiles!events_created_by_fkey ( first_name, last_name, preferred_name )`,
    );

  if (!opts.isAdmin) {
    const orgList = opts.orgIds.map((id) => `"${id}"`).join(",");
    query = query.or(
      `created_by.eq.${opts.userId}${opts.orgIds.length ? `,org_id.in.(${orgList})` : ""}`,
    );
  }

  const { data, error } = await query;
  if (error) console.error("[listManagedEvents] query failed:", error.message);
  if (!data) return [];

  return data
    .map((e: any): ManagedEventRow => {
      const starts = (e.event_sessions ?? [])
        .map((s: any) => s.starts_at)
        .sort();
      const active = (e.event_registrations ?? []).filter(
        (r: any) => !["cancelled", "denied"].includes(r.status),
      );
      return {
        id: e.id,
        slug: e.slug,
        title: e.title,
        status: e.status,
        visibility: e.visibility,
        isFeatured: e.is_featured,
        priceModel: e.price_model,
        priceCents: e.price_cents,
        childCapacity: e.child_capacity,
        nextStartsAt: starts[0] ?? null,
        registrationCount: active.length,
        orgName: e.organizations?.name ?? null,
        createdBy: e.profiles ? (e.profiles.preferred_name || `${e.profiles.first_name ?? ""} ${e.profiles.last_name ?? ""}`.trim() || null) : null,
      };
    })
    .sort((a, b) => (b.nextStartsAt ?? "").localeCompare(a.nextStartsAt ?? ""));
}

export interface EditableEvent {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  whatToExpect: string | null;
  heroImageUrl: string | null;
  joinMode: string;
  style: string | null;
  participationType: string;
  ageMinMonths: number | null;
  ageMaxMonths: number | null;
  priceModel: string;
  priceCents: number;
  childCapacity: number | null;
  adultCapacity: number | null;
  visibility: string;
  status: string;
  requiresApproval: boolean;
  waitlistEnabled: boolean;
  isFeatured: boolean;
  timezone: string;
  session: { id: string; startsAt: string; endsAt: string } | null;
  location: {
    kind: string;
    neighborhood: string | null;
    address: string | null;
    arrivalNotes: string | null;
    platform: string | null;
    joinUrl: string | null;
    lat: number | null;
    lng: number | null;
  } | null;
  resources: { id: string; label: string; url: string | null; kind: string }[];
  instructors: { id: string; name: string | null; roleLabel: string | null; bio: string | null; avatarUrl: string | null }[];
}

export async function getEventForEdit(id: string): Promise<EditableEvent | null> {
  const supabase = await createClient();
  const { data: e } = await supabase
    .from("events")
    .select(
      `*, event_sessions ( id, starts_at, ends_at ),
       event_locations ( kind, neighborhood, address, lat, lng, arrival_notes, platform, join_url ),
       event_resources ( id, label, url, kind, position ),
       event_instructors ( id, name, role_label, bio, avatar_url, position )`,
    )
    .eq("id", id)
    .maybeSingle();
  if (!e) return null;

  const s = (e.event_sessions ?? []).sort((a: any, b: any) =>
    a.starts_at.localeCompare(b.starts_at),
  )[0];
  const l = (e.event_locations ?? [])[0];

  return {
    id: e.id,
    slug: e.slug,
    title: e.title,
    summary: e.summary,
    whatToExpect: e.what_to_expect,
    heroImageUrl: e.hero_image_url,
    joinMode: e.join_mode,
    style: e.style,
    participationType: e.participation_type,
    ageMinMonths: e.age_min_months,
    ageMaxMonths: e.age_max_months,
    priceModel: e.price_model,
    priceCents: e.price_cents,
    childCapacity: e.child_capacity,
    adultCapacity: e.adult_capacity,
    visibility: e.visibility,
    status: e.status,
    requiresApproval: e.requires_approval,
    waitlistEnabled: e.waitlist_enabled,
    isFeatured: e.is_featured,
    timezone: e.timezone,
    session: s ? { id: s.id, startsAt: s.starts_at, endsAt: s.ends_at } : null,
    location: l
      ? {
          kind: l.kind,
          neighborhood: l.neighborhood,
          address: l.address,
          arrivalNotes: l.arrival_notes,
          platform: l.platform,
          joinUrl: l.join_url,
          lat: l.lat ?? null,
          lng: l.lng ?? null,
        }
      : null,
    resources: (e.event_resources ?? [])
      .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
      .map((r: any) => ({ id: r.id, label: r.label, url: r.url, kind: r.kind })),
    instructors: (e.event_instructors ?? [])
      .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
      .map((i: any) => ({
        id: i.id,
        name: i.name,
        roleLabel: i.role_label,
        bio: i.bio,
        avatarUrl: i.avatar_url,
      })),
  };
}

export interface RosterChild {
  id: string;
  petName: string | null;
  birthMonth: number | null;
  birthYear: number | null;
  supportNeeds: string[];
  supportNote: string | null;
  attendanceStatus: string;
}
export interface RosterPayment {
  status: string;
  amountCents: number;
  currency: string;
  refundedAmountCents: number;
}
export interface RosterEntry {
  registrationId: string;
  status: string;
  adultCount: number;
  contactEmail: string | null;
  contactPhone: string | null;
  registeredAt: string;
  children: RosterChild[];
  emergencyContacts: { name: string; phone: string }[];
  pickups: { name: string; phone: string }[];
  /** Payment record for paid events (null for free/included events). */
  payment: RosterPayment | null;
}

export async function getRoster(eventId: string): Promise<RosterEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_registrations")
    .select(
      `id, status, adult_count, contact_email, contact_phone, registered_at,
       event_registration_children ( id, display_pet_name, birth_month, birth_year, support_needs, support_note, attendance_status ),
       emergency_contacts ( name, phone ),
       authorized_pickups ( name, phone ),
       event_payments ( status, amount_cents, currency, refunded_amount_cents )`,
    )
    .eq("event_id", eventId)
    .order("registered_at", { ascending: true });

  return (data ?? []).map((r: any): RosterEntry => {
    const pay = Array.isArray(r.event_payments) ? r.event_payments[0] : r.event_payments;
    return {
    registrationId: r.id,
    status: r.status,
    adultCount: r.adult_count,
    contactEmail: r.contact_email,
    contactPhone: r.contact_phone,
    registeredAt: r.registered_at,
    payment: pay
      ? {
          status: pay.status,
          amountCents: pay.amount_cents ?? 0,
          currency: pay.currency ?? "usd",
          refundedAmountCents: pay.refunded_amount_cents ?? 0,
        }
      : null,
    children: (r.event_registration_children ?? []).map((c: any) => ({
      id: c.id,
      petName: c.display_pet_name,
      birthMonth: c.birth_month,
      birthYear: c.birth_year,
      supportNeeds: c.support_needs ?? [],
      supportNote: c.support_note,
      attendanceStatus: c.attendance_status,
    })),
    emergencyContacts: (r.emergency_contacts ?? []).map((x: any) => ({ name: x.name, phone: x.phone })),
    pickups: (r.authorized_pickups ?? []).map((x: any) => ({ name: x.name, phone: x.phone })),
    };
  });
}
