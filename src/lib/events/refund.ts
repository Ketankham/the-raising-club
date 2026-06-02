import "server-only";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type RefundOutcome = { refunded: boolean; amountCents: number };

/**
 * Refund a paid event registration's payment and mark it refunded. No-op for
 * free registrations or ones already refunded / without a Stripe payment intent.
 * Runs under the SERVICE-ROLE client (event_payments is service-role-write only)
 * so it works for both admin-initiated and user self-cancellations. If the Stripe
 * refund call fails we do NOT mark the row refunded (so it can be retried).
 */
export async function refundEventRegistration(
  admin: SupabaseClient,
  stripe: Stripe | null,
  registrationId: string,
): Promise<RefundOutcome> {
  const { data: pay } = await admin
    .from("event_payments")
    .select("status, amount_cents, stripe_payment_intent_id")
    .eq("registration_id", registrationId)
    .maybeSingle();

  if (!pay || (pay as any).status !== "paid" || !(pay as any).stripe_payment_intent_id) {
    return { refunded: false, amountCents: 0 };
  }

  if (stripe) {
    try {
      await stripe.refunds.create({ payment_intent: (pay as any).stripe_payment_intent_id });
    } catch (e) {
      console.error("[events refund] stripe refund failed", e);
      return { refunded: false, amountCents: 0 };
    }
  }

  const amountCents = (pay as any).amount_cents ?? 0;
  await admin
    .from("event_payments")
    .update({ status: "refunded", refunded_amount_cents: amountCents })
    .eq("registration_id", registrationId);

  return { refunded: true, amountCents };
}
