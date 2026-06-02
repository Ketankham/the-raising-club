import "server-only";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Stripe subscription.status → our user_plans.status. */
function mapStatus(s: Stripe.Subscription.Status): string {
  switch (s) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "scheduled"; // incomplete / paused
  }
}

/**
 * Upsert a user_plans row from a Stripe Subscription and refresh the entitlement
 * snapshot. Idempotent (keyed by stripe_subscription_id). Subject + plan come
 * from the subscription metadata stamped at checkout.
 */
export async function syncSubscriptionFromStripe(
  admin: SupabaseClient,
  subscription: Stripe.Subscription,
): Promise<void> {
  const md = subscription.metadata ?? {};
  const subjectType = md.subjectType as "user" | "household" | "org" | undefined;
  const subjectId = md.subjectId as string | undefined;
  const planId = md.planId as string | undefined;
  const interval = (md.interval as string) === "annual" ? "annual" : "monthly";
  if (!subjectType || !subjectId || !planId) {
    console.error("[billing sync] subscription missing metadata", subscription.id);
    return;
  }

  const item = subscription.items.data[0];
  const periodEnd = item?.current_period_end ?? null;
  const status = mapStatus(subscription.status);

  const row = {
    subject_type: subjectType,
    subject_id: subjectId,
    plan_id: planId,
    interval,
    source: "stripe" as const,
    status,
    starts_at: new Date(subscription.start_date * 1000).toISOString(),
    ends_at: null as string | null,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
  };

  // Upsert on the unique stripe_subscription_id.
  const { error } = await admin.from("user_plans").upsert(row, { onConflict: "stripe_subscription_id" });
  if (error) {
    console.error("[billing sync] upsert failed", error.message);
    return;
  }

  await admin.rpc("recompute_entitlement", { p_subject_type: subjectType, p_subject_id: subjectId });
}
