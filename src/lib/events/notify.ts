import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Read an event + earliest session and build the shared notification tokens. */
async function eventNotifVars(
  client: SupabaseClient,
  eventId: string,
): Promise<{ vars: Record<string, string>; link: string | null } | null> {
  const { data: ev } = await client
    .from("events")
    .select("title, slug, timezone, event_sessions ( starts_at )")
    .eq("id", eventId)
    .maybeSingle();
  if (!ev) return null;

  const sessions = ((ev as any).event_sessions ?? []) as { starts_at: string }[];
  const next = sessions.slice().sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at))[0];
  const tz = ((ev as any).timezone as string) || undefined;
  const eventDate = next
    ? new Date(next.starts_at).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        timeZone: tz,
      })
    : "";
  const eventTime = next
    ? new Date(next.starts_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz })
    : "";
  const link = (ev as any).slug ? `/events/${(ev as any).slug}` : null;

  return {
    vars: {
      event_name: (ev as any).title ?? "your event",
      event_date: eventDate,
      event_time: eventTime,
      event_timezone: tz ?? "",
      event_link: link ?? "",
    },
    link,
  };
}

/**
 * Emit the "You're registered!" confirmation (`event.registration_confirmed`)
 * for a registration that just became `confirmed` — free events (immediately,
 * user-context client) and paid events (post-payment, service-role webhook
 * client). Fail-soft: a notification must never break registration.
 */
export async function emitRegistrationConfirmed(
  client: SupabaseClient,
  eventId: string,
  userId: string,
): Promise<void> {
  try {
    const built = await eventNotifVars(client, eventId);
    if (!built) return;
    await client.rpc("create_notification", {
      p_user_id: userId,
      p_type_key: "event.registration_confirmed",
      p_vars: built.vars,
      p_link: built.link,
    });
  } catch (e) {
    console.error("[events] registration_confirmed emit failed", e);
  }
}

/**
 * Emit `event.cancelled` when a registration is cancelled (user self-cancel or
 * admin/host cancel + refund). Fail-soft. The recipient is the registrant, so
 * admin-side callers must pass a service-role client.
 */
export async function emitRegistrationCancelled(
  client: SupabaseClient,
  eventId: string,
  userId: string,
): Promise<void> {
  try {
    const built = await eventNotifVars(client, eventId);
    if (!built) return;
    await client.rpc("create_notification", {
      p_user_id: userId,
      p_type_key: "event.cancelled",
      p_vars: built.vars,
      p_link: built.link,
    });
  } catch (e) {
    console.error("[events] cancelled emit failed", e);
  }
}
