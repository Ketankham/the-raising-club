import "server-only";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { getActiveStripeConfig } from "@/lib/payments/settings";
import { handleStripeEvent } from "@/lib/billing/webhook-handlers";

// Node runtime: signature verification needs the raw request body.
export const runtime = "nodejs";
// Never cache / prerender — Stripe is the caller, there is no session.
export const dynamic = "force-dynamic";

/**
 * Stripe webhook. Verifies the signature against the ACTIVE mode's webhook
 * secret (admin-managed, DB-first), then dispatches to handleStripeEvent which
 * writes via the service role. Public route — exclude from auth in proxy.ts.
 */
export async function POST(request: Request) {
  const resolved = await getStripe();
  if (!resolved) {
    return Response.json({ error: "Stripe is not configured." }, { status: 503 });
  }
  const { stripe } = resolved;
  const { webhookSecret } = await getActiveStripeConfig();
  if (!webhookSecret) {
    return Response.json({ error: "Webhook secret is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing signature." }, { status: 400 });

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid signature";
    return Response.json({ error: `Webhook verification failed: ${message}` }, { status: 400 });
  }

  try {
    await handleStripeEvent(stripe, event);
  } catch (e) {
    // Log and 500 so Stripe retries — but never throw the raw error to Stripe.
    console.error(`[stripe webhook] handler error for ${event.type}:`, e);
    return Response.json({ error: "Handler error" }, { status: 500 });
  }

  return Response.json({ received: true });
}
