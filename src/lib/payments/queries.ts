import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { StripeMode } from "./settings";

/**
 * Admin-facing view of payment_settings with secrets MASKED (last 4 only).
 * Gate every caller behind requireAdmin — this uses the service-role client.
 */
export type MaskedPaymentSettings = {
  mode: StripeMode;
  test: { publishableKey: string; secretKeySet: boolean; secretKeyLast4: string; webhookSecretSet: boolean };
  live: { publishableKey: string; secretKeySet: boolean; secretKeyLast4: string; webhookSecretSet: boolean };
};

const last4 = (v: string | null | undefined) => (v && v.length >= 4 ? v.slice(-4) : "");

export async function getPaymentSettingsForAdmin(): Promise<MaskedPaymentSettings> {
  const admin = createAdminClient();
  const empty: MaskedPaymentSettings = {
    mode: "test",
    test: { publishableKey: "", secretKeySet: false, secretKeyLast4: "", webhookSecretSet: false },
    live: { publishableKey: "", secretKeySet: false, secretKeyLast4: "", webhookSecretSet: false },
  };
  if (!admin) return empty;

  const { data } = await admin.from("payment_settings").select("*").eq("id", 1).maybeSingle();
  if (!data) return empty;

  return {
    mode: data.mode === "live" ? "live" : "test",
    test: {
      publishableKey: data.test_publishable_key ?? "",
      secretKeySet: Boolean(data.test_secret_key),
      secretKeyLast4: last4(data.test_secret_key),
      webhookSecretSet: Boolean(data.test_webhook_secret),
    },
    live: {
      publishableKey: data.live_publishable_key ?? "",
      secretKeySet: Boolean(data.live_secret_key),
      secretKeyLast4: last4(data.live_secret_key),
      webhookSecretSet: Boolean(data.live_webhook_secret),
    },
  };
}
