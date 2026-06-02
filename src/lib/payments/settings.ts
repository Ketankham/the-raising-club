import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Stripe credentials resolution.
 *
 * Source of truth is the admin-managed `payment_settings` singleton (entered at
 * /admin/settings/payments), so the owner can paste demo (test) or real (live)
 * keys and flip modes with no redeploy. Env vars are only a bootstrap fallback
 * for local dev before the table is populated.
 *
 * Server-only — these helpers read secret + webhook keys via the service-role
 * client and must never run in (or leak to) the browser.
 */

export type StripeMode = "test" | "live";

export type StripeConfig = {
  mode: StripeMode;
  publishableKey: string | null;
  secretKey: string | null;
  webhookSecret: string | null;
  /** True when a usable secret key is present for the active mode. */
  configured: boolean;
};

type Row = {
  mode: StripeMode;
  test_publishable_key: string | null;
  test_secret_key: string | null;
  test_webhook_secret: string | null;
  live_publishable_key: string | null;
  live_secret_key: string | null;
  live_webhook_secret: string | null;
};

const envFallback = (mode: StripeMode): StripeConfig => ({
  mode,
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null,
  secretKey: process.env.STRIPE_SECRET_KEY ?? null,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? null,
  configured: Boolean(process.env.STRIPE_SECRET_KEY),
});

/** The active-mode Stripe config (DB first, env fallback). */
export async function getActiveStripeConfig(): Promise<StripeConfig> {
  const admin = createAdminClient();
  if (!admin) return envFallback("test");

  const { data } = await admin
    .from("payment_settings")
    .select(
      "mode, test_publishable_key, test_secret_key, test_webhook_secret, live_publishable_key, live_secret_key, live_webhook_secret",
    )
    .eq("id", 1)
    .maybeSingle();

  const row = data as Row | null;
  if (!row) return envFallback("test");

  const mode = row.mode === "live" ? "live" : "test";
  const publishableKey =
    (mode === "live" ? row.live_publishable_key : row.test_publishable_key) ??
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
    null;
  const secretKey =
    (mode === "live" ? row.live_secret_key : row.test_secret_key) ??
    process.env.STRIPE_SECRET_KEY ??
    null;
  const webhookSecret =
    (mode === "live" ? row.live_webhook_secret : row.test_webhook_secret) ??
    process.env.STRIPE_WEBHOOK_SECRET ??
    null;

  return { mode, publishableKey, secretKey, webhookSecret, configured: Boolean(secretKey) };
}
