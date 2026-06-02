import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Emit the "You're registered!" confirmation (`event.registration_confirmed`)
 * for a registration that just became `confirmed` — free events (immediately,
 * user-context client) and paid events (post-payment, service-role webhook
 * client). Fail-soft: a notification must never break registration. Builds the
 * template vars (event name + earliest session date/time) from data it reads
 * here, so callers only pass the event id + recipient.
 */
export async function emitRegistrationConfirmed(
  client: SupabaseClient,
  eventId: string,
  userId: string,
): Promise<void> {
  try {
    const { data: ev } = await client
      .from("events")
      .select("title, slug, timezone, event_sessions ( starts_at )")
      .eq("id", eventId)
      .maybeSingle();
    if (!ev) return;

    const sessions = ((ev as any).event_sessions ?? []) as { starts_at: string }[];
    const next = sessions
      .slice()
      .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at))[0];
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
      ? new Date(next.starts_at).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: tz,
        })
      : "";
    const link = (ev as any).slug ? `/events/${(ev as any).slug}` : null;

    await client.rpc("create_notification", {
      p_user_id: userId,
      p_type_key: "event.registration_confirmed",
      p_vars: {
        event_name: (ev as any).title ?? "your event",
        event_date: eventDate,
        event_time: eventTime,
        event_timezone: tz ?? "",
        event_link: link ?? "",
      },
      p_link: link,
    });
  } catch (e) {
    console.error("[events] registration_confirmed emit failed", e);
  }
}
