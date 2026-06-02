import "server-only";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncSubscriptionFromStripe } from "./sync";
import { fulfillEventPayment } from "@/lib/events/fulfillment";
import { fulfillCoursePurchase } from "@/lib/courses/fulfillment";

/**
 * Central Stripe event dispatcher. All writes go through the service-role client.
 * Handlers must be idempotent — Stripe retries and may deliver duplicates /
 * out-of-order events.
 *
 *  - Subscriptions (this file): customer.subscription.* + invoice.* → user_plans
 *  - Phase 6 (events):  checkout.session.completed (mode=payment) / refunds
 *  - Phase 7 (courses): checkout.session.completed (course metadata)
 */
export async function handleStripeEvent(stripe: Stripe, event: Stripe.Event): Promise<void> {
  const admin = createAdminClient();
  if (!admin) {
    console.error("[stripe webhook] SUPABASE_SERVICE_ROLE_KEY missing — cannot persist", event.type);
    return;
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await syncSubscriptionFromStripe(admin, sub);
      if (event.type === "customer.subscription.created") await notifySubscription(admin, sub, "subscription.activated");
      if (event.type === "customer.subscription.deleted") await notifySubscription(admin, sub, "subscription.canceled");
      break;
    }

    case "invoice.paid":
    case "invoice.payment_failed": {
      // Re-fetch the subscription so status/period are authoritative.
      const invoice = event.data.object as Stripe.Invoice;
      const subId =
        typeof (invoice as { subscription?: string | Stripe.Subscription }).subscription === "string"
          ? ((invoice as { subscription?: string }).subscription as string)
          : (invoice as { subscription?: Stripe.Subscription }).subscription?.id;
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        await syncSubscriptionFromStripe(admin, sub);
        if (event.type === "invoice.payment_failed") await notifySubscription(admin, sub, "subscription.payment_failed");
      }
      break;
    }

    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.subscription) {
        const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const sub = await stripe.subscriptions.retrieve(subId);
        await syncSubscriptionFromStripe(admin, sub);
      } else if (session.mode === "payment") {
        const kind = session.metadata?.kind;
        if (kind === "event") await fulfillEventPayment(admin, session);
        else if (kind === "course") await fulfillCoursePurchase(admin, session);
      }
      break;
    }

    case "charge.refunded":
      // TODO(phase-6b): refund → event_payments refund fields + event_credits ledger.
      console.info(`[stripe webhook] (todo refunds) ${event.type}`);
      break;

    default:
      console.info(`[stripe webhook] unhandled ${event.type}`);
  }
}

/** Fail-soft subscription notification to the checkout initiator (metadata.userId). */
async function notifySubscription(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  sub: Stripe.Subscription,
  typeKey: string,
): Promise<void> {
  const userId = sub.metadata?.userId;
  if (!userId) return;
  try {
    const planId = sub.metadata?.planId;
    let planName = "your membership";
    if (planId) {
      const { data } = await admin.from("plans").select("name").eq("id", planId).maybeSingle();
      if (data?.name) planName = data.name;
    }
    await admin.rpc("create_notification", {
      p_user_id: userId,
      p_type_key: typeKey,
      p_vars: { planName },
      p_link: "/dashboard/settings",
    });
  } catch (e) {
    console.error(`[stripe webhook] ${typeKey} notification failed`, e);
  }
}
