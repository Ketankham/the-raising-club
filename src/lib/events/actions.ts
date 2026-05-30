"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ToggleSaveResult =
  | { ok: true; saved: boolean }
  | { ok: false; reason: "unauthenticated" | "error" };

/**
 * Toggle "Save for later" for the current user. Returns `unauthenticated` so the
 * client can route guests to sign-in (saving requires an account). RLS ensures a
 * user can only write their own rows.
 */
export async function toggleSaveEvent(eventId: string): Promise<ToggleSaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  const { data: existing } = await supabase
    .from("event_saves")
    .select("event_id")
    .eq("user_id", user.id)
    .eq("event_id", eventId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("event_saves")
      .delete()
      .eq("user_id", user.id)
      .eq("event_id", eventId);
    if (error) return { ok: false, reason: "error" };
    revalidatePath("/events");
    return { ok: true, saved: false };
  }

  const { error } = await supabase
    .from("event_saves")
    .insert({ user_id: user.id, event_id: eventId });
  if (error) return { ok: false, reason: "error" };
  revalidatePath("/events");
  return { ok: true, saved: true };
}

export type MessageResult = { ok: true } | { ok: false; reason: "unauthenticated" | "error" };

/**
 * "Contact the organizer" from the event detail Message tab.
 * TODO: persist + email the host once an event-messages table / mailer exists.
 * For now it only authenticates and validates the input (no delivery yet).
 */
export async function sendOrganizerMessage(
  _eventId: string,
  subject: string,
  body: string,
): Promise<MessageResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };
  if (!subject.trim() || !body.trim()) return { ok: false, reason: "error" };
  // No messages table yet — delivery is wired up in a later milestone.
  return { ok: true };
}
