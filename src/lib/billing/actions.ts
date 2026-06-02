"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";
import { planByKey } from "@/lib/plans/queries";
import { resolveBillingSubject } from "./subject";

type CheckoutResult = { ok: true; url: string } | { ok: false; error: string };

async function origin(): Promise<string> {
  return (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
}

/**
 * Create a Stripe Checkout session for a subscription plan. Price is re-read
 * server-side from the DB (never trust the client). The subject (household / org
 * / user) + plan are stamped into subscription metadata so the webhook can sync.
 */
export async function startSubscriptionCheckout(
  planKey: string,
  interval: "monthly" | "annual",
): Promise<CheckoutResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const resolved = await getStripe();
  if (!resolved) return { ok: false, error: "Payments are not configured yet." };
  const { stripe } = resolved;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email, stripe_customer_id, first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return { ok: false, error: "No profile" };

  const plan = await planByKey(planKey);
  if (!plan || !plan.isActive) return { ok: false, error: "That plan isn't available." };
  if (plan.price === "free") return { ok: false, error: "The free plan needs no checkout." };

  const priceId = interval === "annual" ? plan.stripePriceAnnualId : plan.stripePriceMonthlyId;
  if (!priceId) return { ok: false, error: `This plan has no ${interval} price configured yet.` };

  // Ensure a Stripe customer for this user.
  let customerId = profile.stripe_customer_id as string | null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.email ?? user.email ?? undefined,
      name: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const subject = await resolveBillingSubject(supabase, user.id, profile.role, {
    create: true,
    householdName: `${profile.first_name ?? "Your"} family`,
  });
  if (!subject) return { ok: false, error: "Could not resolve a billing account." };

  const base = await origin();
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: {
          subjectType: subject.subjectType,
          subjectId: subject.subjectId,
          planId: plan.id,
          planKey: plan.key,
          interval,
          userId: user.id,
        },
      },
      success_url: `${base}/dashboard/settings?billing=success`,
      cancel_url: `${base}/dashboard/settings?billing=cancelled`,
      allow_promotion_codes: true,
    });
    if (!session.url) return { ok: false, error: "Stripe did not return a checkout URL." };
    return { ok: true, url: session.url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Checkout failed" };
  }
}

/** Open the Stripe Customer Portal (manage / cancel / update card / switch interval). */
export async function openBillingPortal(): Promise<CheckoutResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const resolved = await getStripe();
  if (!resolved) return { ok: false, error: "Payments are not configured yet." };

  const { data: profile } = await supabase.from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle();
  const customerId = profile?.stripe_customer_id as string | null;
  if (!customerId) return { ok: false, error: "No billing account yet — subscribe to a plan first." };

  const base = await origin();
  try {
    const portal = await resolved.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${base}/dashboard/settings`,
    });
    return { ok: true, url: portal.url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not open billing portal" };
  }
}
