"use server";

import { createClient } from "@/lib/supabase/server";
import type { EventThread, MyThread, ThreadMessage } from "./message-types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function mapMsg(m: any): ThreadMessage {
  return {
    id: m.id,
    body: m.body,
    senderRole: m.sender_role,
    createdAt: m.created_at,
    readAt: m.read_at,
  };
}

async function findMyRegistration(supabase: any, eventId: string, userId: string) {
  const { data } = await supabase
    .from("event_registrations")
    .select("id")
    .eq("event_id", eventId)
    .eq("registrant_user_id", userId)
    .not("status", "in", "(cancelled,denied)")
    .maybeSingle();
  return data?.id as string | undefined;
}

/** Attendee: load my thread for an event and mark organizer messages read. */
export async function getMyEventThread(eventId: string): Promise<MyThread> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { registered: false, registrationId: null, messages: [] };

  const regId = await findMyRegistration(supabase, eventId, user.id);
  if (!regId) return { registered: false, registrationId: null, messages: [] };

  const { data: msgs } = await supabase
    .from("event_messages")
    .select("id, body, sender_role, created_at, read_at")
    .eq("registration_id", regId)
    .order("created_at", { ascending: true });

  // Mark organizer → attendee messages read.
  await supabase
    .from("event_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("registration_id", regId)
    .eq("sender_role", "organizer")
    .is("read_at", null);

  return { registered: true, registrationId: regId, messages: (msgs ?? []).map(mapMsg) };
}

export type PostResult =
  | { ok: true; message: ThreadMessage }
  | { ok: false; reason: "unauthenticated" | "not_registered" | "forbidden" | "error"; message?: string };

/** Attendee: post a message into my thread. */
export async function postMessageToEvent(eventId: string, body: string): Promise<PostResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };
  if (!body.trim()) return { ok: false, reason: "error", message: "Empty message" };

  const regId = await findMyRegistration(supabase, eventId, user.id);
  if (!regId) return { ok: false, reason: "not_registered" };

  const { data, error } = await supabase
    .from("event_messages")
    .insert({
      event_id: eventId,
      registration_id: regId,
      sender_user_id: user.id,
      sender_role: "attendee",
      body: body.trim(),
    })
    .select("id, body, sender_role, created_at, read_at")
    .single();
  if (error || !data) return { ok: false, reason: "error", message: error?.message };
  return { ok: true, message: mapMsg(data) };
}

/** Organizer: all threads for an event (RLS limits to events the caller manages). */
export async function getEventThreads(eventId: string): Promise<EventThread[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_registrations")
    .select(
      `id, contact_email, status,
       profiles ( first_name, last_name, preferred_name ),
       event_messages ( id, body, sender_role, created_at, read_at )`,
    )
    .eq("event_id", eventId)
    .not("status", "in", "(cancelled,denied)");

  const threads = (data ?? []).map((r: any): EventThread => {
    const p = r.profiles;
    const name =
      p?.preferred_name ||
      [p?.first_name, p?.last_name].filter(Boolean).join(" ") ||
      r.contact_email ||
      "Registrant";
    const messages = (r.event_messages ?? [])
      .map(mapMsg)
      .sort((a: ThreadMessage, b: ThreadMessage) => a.createdAt.localeCompare(b.createdAt));
    const unread = messages.filter((m: ThreadMessage) => m.senderRole === "attendee" && !m.readAt).length;
    const lastAt = messages.length ? messages[messages.length - 1].createdAt : null;
    return { registrationId: r.id, registrantName: name, contactEmail: r.contact_email, messages, unread, lastAt };
  });

  // Threads with activity first (most recent), then the rest.
  return threads.sort((a, b) => (b.lastAt ?? "").localeCompare(a.lastAt ?? ""));
}

/** Organizer: post a reply into a registrant's thread. */
export async function postOrganizerMessage(registrationId: string, body: string): Promise<PostResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };
  if (!body.trim()) return { ok: false, reason: "error", message: "Empty message" };

  // RLS: a manager can read this registration; others get null.
  const { data: reg } = await supabase
    .from("event_registrations")
    .select("event_id")
    .eq("id", registrationId)
    .maybeSingle();
  if (!reg) return { ok: false, reason: "forbidden" };

  const { data, error } = await supabase
    .from("event_messages")
    .insert({
      event_id: reg.event_id,
      registration_id: registrationId,
      sender_user_id: user.id,
      sender_role: "organizer",
      body: body.trim(),
    })
    .select("id, body, sender_role, created_at, read_at")
    .single();
  if (error || !data) return { ok: false, reason: "error", message: error?.message };
  return { ok: true, message: mapMsg(data) };
}

/** Organizer: mark a thread's attendee messages as read. */
export async function markThreadReadByOrganizer(registrationId: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("event_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("registration_id", registrationId)
    .eq("sender_role", "attendee")
    .is("read_at", null);
}
