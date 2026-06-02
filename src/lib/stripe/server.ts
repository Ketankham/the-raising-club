import "server-only";
import Stripe from "stripe";
import { getActiveStripeConfig, type StripeConfig } from "@/lib/payments/settings";

/**
 * Builds a Stripe client from the active payment_settings (DB-first, env
 * fallback). Returns the client plus the resolved config so callers know the
 * mode and can surface a clear error when Stripe isn't configured yet.
 *
 * Not memoised: the admin can swap keys / flip test↔live at runtime, and a
 * stale singleton would keep using the old key.
 */
export async function getStripe(): Promise<{ stripe: Stripe; config: StripeConfig } | null> {
  const config = await getActiveStripeConfig();
  if (!config.secretKey) return null;
  const stripe = new Stripe(config.secretKey, {
    // apiVersion intentionally omitted — pin to the SDK's bundled default.
    appInfo: { name: "The Raising Club" },
  });
  return { stripe, config };
}
