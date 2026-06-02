import "server-only";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Confirm a paid event registration from a completed Checkout session.
 * Idempotent: keyed off the registration + only advances a pending row.
 * Runs under the service-role client (webhook actor).
 */
export async function fulfillEventPayment(admin: SupabaseClient, session: Stripe.Checkout.Session): Promise<void> {
  const md = session.metadata ?? {};
  const registrationId = md.registrationId as string | undefined;
  if (!registrationId) {
    console.error("[event fulfilment] missing registrationId", session.id);
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;

  // Mark the payment paid.
  await admin
    .from("event_payments")
    .update({
      status: "paid",
      stripe_payment_intent_id: paymentIntentId,
      stripe_checkout_session_id: session.id,
    })
    .eq("registration_id", registrationId);

  // Confirm the registration (respect approval-required events).
  const { data: reg } = await admin
    .from("event_registrations")
    .select("id, status, event_id, registrant_user_id, events(title, requires_approval, slug)")
    .eq("id", registrationId)
    .maybeSingle();
  if (!reg) return;

  const ev = Array.isArray(reg.events) ? reg.events[0] : reg.events;
  const nextStatus = ev?.requires_approval ? "pending" : "confirmed";
  if (reg.status === "pending") {
    await admin.from("event_registrations").update({ status: nextStatus }).eq("id", registrationId);
  }

  // Notify the registrant (fail-soft; service-role create_notification).
  try {
    await admin.rpc("create_notification", {
      p_user_id: reg.registrant_user_id,
      p_type_key: "event.payment_received",
      p_vars: { eventName: ev?.title ?? "your event" },
      p_link: ev?.slug ? `/events/${ev.slug}` : null,
    });
  } catch (e) {
    console.error("[event fulfilment] notification failed", e);
  }
}
