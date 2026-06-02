import "server-only";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { emitRegistrationConfirmed } from "./notify";

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

  // Mark the payment paid. event_payments is service-role-write only, so the
  // user-context pending insert in startEventCheckout is RLS-blocked — create
  // the row here if it's missing so the receipt/refund record always persists.
  const paidFields = {
    status: "paid",
    stripe_payment_intent_id: paymentIntentId,
    stripe_checkout_session_id: session.id,
  };
  const { data: existingPayment } = await admin
    .from("event_payments")
    .select("id")
    .eq("registration_id", registrationId)
    .maybeSingle();
  if (existingPayment) {
    await admin.from("event_payments").update(paidFields).eq("registration_id", registrationId);
  } else {
    await admin.from("event_payments").insert({
      registration_id: registrationId,
      amount_cents: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
      ...paidFields,
    });
  }

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
  // Always send the payment receipt; on a confirmed (non-approval) event also
  // send the "You're registered" confirmation so paid + free flows match.
  try {
    const amount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (session.currency ?? "usd").toUpperCase(),
      minimumFractionDigits: (session.amount_total ?? 0) % 100 === 0 ? 0 : 2,
    }).format((session.amount_total ?? 0) / 100);
    await admin.rpc("create_notification", {
      p_user_id: reg.registrant_user_id,
      p_type_key: "event.payment_received",
      // Template tokens are `event_name` + `amount` (not `eventName`).
      p_vars: { event_name: ev?.title ?? "your event", amount },
      p_link: ev?.slug ? `/events/${ev.slug}` : null,
    });
  } catch (e) {
    console.error("[event fulfilment] notification failed", e);
  }

  if (nextStatus === "confirmed" && reg.status === "pending") {
    await emitRegistrationConfirmed(admin, reg.event_id as string, reg.registrant_user_id as string);
  }
}
