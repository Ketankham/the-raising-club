import { createClient } from "@/lib/supabase/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface MyEventRow {
  slug: string;
  title: string;
  coverImageUrl: string | null;
  hostName: string | null;
  startsAt: string | null;
  endsAt: string | null;
  location: { kind: "physical" | "digital"; neighborhood: string | null; address: string | null; lat: number | null; lng: number | null } | null;
  registrationStatus: string;
}

/**
 * The current user's registered events, split into upcoming vs past. Used by the
 * logged-in "My Events" page. Events are read through the registration embed
 * (public/published events resolve via RLS).
 */
export async function getMyEvents(): Promise<{ upcoming: MyEventRow[]; past: MyEventRow[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { upcoming: [], past: [] };

  const { data } = await supabase
    .from("event_registrations")
    .select(
      `status,
       events (
         slug, title, hero_image_url, host_name, status,
         event_sessions ( starts_at, ends_at ),
         event_locations ( kind, neighborhood, address, lat, lng )
       )`,
    )
    .eq("registrant_user_id", user.id)
    // Keep cancelled rows so the user still sees the event marked "Cancelled"
    // (denied/never-approved stay hidden).
    .neq("status", "denied");

  const now = Date.now();
  const upcoming: MyEventRow[] = [];
  const past: MyEventRow[] = [];

  for (const reg of data ?? []) {
    const e = (reg as any).events;
    if (!e) continue; // event not visible (e.g. private) — skip

    const sessions = (e.event_sessions ?? [])
      .map((s: any) => ({ starts: s.starts_at, ends: s.ends_at }))
      .sort((a: any, b: any) => +new Date(a.starts) - +new Date(b.starts));
    const nextUpcoming = sessions.find((s: any) => +new Date(s.starts) >= now);
    const chosen = nextUpcoming ?? sessions[sessions.length - 1] ?? null;
    const loc = (e.event_locations ?? [])[0];

    const row: MyEventRow = {
      slug: e.slug,
      title: e.title,
      coverImageUrl: e.hero_image_url,
      hostName: e.host_name,
      startsAt: chosen?.starts ?? null,
      endsAt: chosen?.ends ?? null,
      location: loc ? { kind: loc.kind, neighborhood: loc.neighborhood, address: loc.address, lat: loc.lat ?? null, lng: loc.lng ?? null } : null,
      registrationStatus: (reg as any).status,
    };

    const isPast =
      (reg as any).status === "cancelled" ||
      ["completed", "cancelled", "archived"].includes(e.status) ||
      !nextUpcoming;
    (isPast ? past : upcoming).push(row);
  }

  upcoming.sort((a, b) => +new Date(a.startsAt ?? 0) - +new Date(b.startsAt ?? 0));
  past.sort((a, b) => +new Date(b.startsAt ?? 0) - +new Date(a.startsAt ?? 0));
  return { upcoming, past };
}
