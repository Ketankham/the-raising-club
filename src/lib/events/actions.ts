"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";
import type { RegistrationPayload } from "./types";

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

export type RegisterResult =
  | { ok: true; registrationId: string; status: string }
  | { ok: false; reason: "unauthenticated" | "payment_required" | "already_registered" | "error"; message?: string };

/**
 * Create a registration (the end of the wizard). For now this is only called for
 * FREE/included events — paid events stop at the Stripe placeholder in the UI.
 * Writes the registration + per-child rows + emergency contact / pickup + waiver
 * acceptances. The event price/approval are re-read server-side (never trusted
 * from the client). RLS ensures the user can only write their own rows.
 */
export async function createRegistration(payload: RegistrationPayload): Promise<RegisterResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  const { data: ev } = await supabase
    .from("events")
    .select("id, price_model, price_cents, requires_approval")
    .eq("id", payload.eventId)
    .maybeSingle();
  if (!ev) return { ok: false, reason: "error", message: "Event not found" };

  const isFree = ev.price_model === "included" || ev.price_cents === 0;
  if (!isFree) {
    // Guard: paid registration must go through payment (not yet wired).
    return { ok: false, reason: "payment_required" };
  }

  // Block a duplicate active registration.
  const { data: existing } = await supabase
    .from("event_registrations")
    .select("id")
    .eq("event_id", ev.id)
    .eq("registrant_user_id", user.id)
    .not("status", "in", "(cancelled,denied)")
    .maybeSingle();
  if (existing) return { ok: false, reason: "already_registered" };

  const status = ev.requires_approval ? "pending" : "confirmed";

  const { data: reg, error: regErr } = await supabase
    .from("event_registrations")
    .insert({
      event_id: ev.id,
      registrant_user_id: user.id,
      status,
      adult_count: payload.adultCount,
      contact_email: payload.contactEmail,
      contact_phone: payload.contactPhone ?? null,
    })
    .select("id")
    .single();
  if (regErr || !reg) return { ok: false, reason: "error", message: regErr?.message };

  const regId = reg.id;
  const detail = await writeRegistrationDetails(supabase, user.id, regId, payload);
  if (!detail.ok) return { ok: false, reason: "error", message: detail.error };

  revalidatePath("/events");
  return { ok: true, registrationId: regId, status };
}

// Shared registration detail inserts (children / contacts / pickup / waivers).
type EventsSupa = Awaited<ReturnType<typeof createClient>>;
async function writeRegistrationDetails(
  supabase: EventsSupa,
  userId: string,
  regId: string,
  payload: RegistrationPayload,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (payload.children.length) {
    const rows = payload.children.map((c) => ({
      registration_id: regId,
      child_id: c.childId ?? null,
      display_pet_name: c.petName ?? null,
      birth_month: c.birthMonth,
      birth_year: c.birthYear,
      support_needs: payload.supportNeeds,
      support_note: payload.supportNote ?? null,
    }));
    const { error } = await supabase.from("event_registration_children").insert(rows);
    if (error) return { ok: false, error: error.message };
  }

  if (payload.emergencyContact?.name && payload.emergencyContact.phone) {
    await supabase.from("emergency_contacts").insert({
      registration_id: regId,
      name: payload.emergencyContact.name,
      phone: payload.emergencyContact.phone,
      relationship: payload.emergencyContact.relationship ?? null,
    });
  }

  if (payload.pickup?.name && payload.pickup.phone) {
    await supabase.from("authorized_pickups").insert({
      registration_id: regId,
      name: payload.pickup.name,
      phone: payload.pickup.phone,
      relationship: payload.pickup.relationship ?? null,
    });
  }

  if (payload.waiverAcceptances.length) {
    const rows = payload.waiverAcceptances.map((w) => ({
      user_id: userId,
      waiver_id: w.waiverId,
      registration_id: regId,
      media_consent: w.mediaConsent ?? "not_set",
    }));
    const { error } = await supabase.from("waiver_acceptances").insert(rows);
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true };
}

export type EventCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; reason: "unauthenticated" | "already_registered" | "not_payable" | "error"; message?: string };

/**
 * Paid-event registration: re-read price server-side, create a PENDING
 * registration + a pending event_payments row, then a Stripe Checkout session.
 * The webhook confirms the registration on payment. Never trusts client price.
 */
export async function startEventCheckout(payload: RegistrationPayload): Promise<EventCheckoutResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  const { data: ev } = await supabase
    .from("events")
    .select("id, slug, title, price_model, price_cents, currency, requires_approval")
    .eq("id", payload.eventId)
    .maybeSingle();
  if (!ev) return { ok: false, reason: "error", message: "Event not found" };

  const isFree = ev.price_model === "included" || ev.price_cents === 0;
  if (isFree) return { ok: false, reason: "not_payable", message: "This event is free." };

  const { data: existing } = await supabase
    .from("event_registrations")
    .select("id")
    .eq("event_id", ev.id)
    .eq("registrant_user_id", user.id)
    .not("status", "in", "(cancelled,denied)")
    .maybeSingle();
  if (existing) return { ok: false, reason: "already_registered" };

  const resolved = await getStripe();
  if (!resolved) return { ok: false, reason: "error", message: "Payments are not configured yet." };
  const { stripe } = resolved;

  // Pending registration (capacity held while they pay).
  const { data: reg, error: regErr } = await supabase
    .from("event_registrations")
    .insert({
      event_id: ev.id,
      registrant_user_id: user.id,
      status: "pending",
      adult_count: payload.adultCount,
      contact_email: payload.contactEmail,
      contact_phone: payload.contactPhone ?? null,
    })
    .select("id")
    .single();
  if (regErr || !reg) return { ok: false, reason: "error", message: regErr?.message };
  const regId = reg.id;

  const detail = await writeRegistrationDetails(supabase, user.id, regId, payload);
  if (!detail.ok) return { ok: false, reason: "error", message: detail.error };

  const amount = ev.price_cents as number;
  const currency = (ev.currency as string) || "usd";
  await supabase.from("event_payments").insert({
    registration_id: regId,
    amount_cents: amount,
    currency,
    status: "pending",
  });

  const base = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amount,
            product_data: { name: ev.title as string },
          },
        },
      ],
      metadata: { kind: "event", registrationId: regId, eventId: ev.id as string, userId: user.id },
      customer_email: payload.contactEmail || user.email || undefined,
      success_url: `${base}/events/${ev.slug}?payment=success`,
      cancel_url: `${base}/events/${ev.slug}/register?payment=cancelled`,
    });
    if (!session.url) return { ok: false, reason: "error", message: "Stripe did not return a URL." };

    await supabase
      .from("event_payments")
      .update({ stripe_checkout_session_id: session.id })
      .eq("registration_id", regId);

    return { ok: true, url: session.url };
  } catch (e) {
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : "Checkout failed" };
  }
}

export type CancelResult =
  | { ok: true }
  | { ok: false; reason: "unauthenticated" | "not_found" | "too_late" | "error"; message?: string };

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Cancel the current user's registration. Re-checks the cancellation cutoff
 * server-side (never trusts the client) and frees the child capacity by setting
 * status = cancelled. Paid refunds/credits arrive with the Stripe milestone.
 */
export async function cancelRegistration(registrationId: string): Promise<CancelResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  // RLS (owns_registration) ensures we can only read/update our own row.
  const { data: reg } = await supabase
    .from("event_registrations")
    .select(
      `id, event_id, status,
       events ( slug, cancellation_cutoff_hours, event_sessions ( starts_at ) )`,
    )
    .eq("id", registrationId)
    .eq("registrant_user_id", user.id)
    .maybeSingle();
  if (!reg) return { ok: false, reason: "not_found" };

  const ev = (reg as any).events;
  const cutoffH = ev?.cancellation_cutoff_hours ?? 12;
  const starts = (ev?.event_sessions ?? [])
    .map((s: any) => +new Date(s.starts_at))
    .filter((t: number) => t >= Date.now())
    .sort((a: number, b: number) => a - b);
  const nextStart = starts[0];
  if (nextStart && Date.now() > nextStart - cutoffH * 3600 * 1000) {
    return { ok: false, reason: "too_late" };
  }

  const { error } = await supabase
    .from("event_registrations")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", registrationId);
  if (error) return { ok: false, reason: "error", message: error.message };

  if (ev?.slug) revalidatePath(`/events/${ev.slug}`);
  revalidatePath("/events");
  return { ok: true };
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
