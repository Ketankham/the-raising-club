"use server";

import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { requireAdmin } from "@/lib/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import type { StripeMode } from "./settings";

type Result = { ok: true } | { ok: false; error: string };

/**
 * Update the admin-managed Stripe credentials. Secret/webhook fields are only
 * overwritten when a fresh (non-empty) value is submitted, so the masked admin
 * form never clobbers an existing key with blanks. Publishable keys overwrite
 * directly (they are public). Service-role write — guarded by requireAdmin.
 */
export async function updatePaymentSettings(input: {
  testPublishableKey: string;
  testSecretKey: string;
  testWebhookSecret: string;
  livePublishableKey: string;
  liveSecretKey: string;
  liveWebhookSecret: string;
}): Promise<Result> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is not configured on the server." };

  const patch: Record<string, string | null> = {
    test_publishable_key: input.testPublishableKey.trim() || null,
    live_publishable_key: input.livePublishableKey.trim() || null,
    updated_by: user.id,
  };
  // Only overwrite secrets when a new value was actually typed.
  if (input.testSecretKey.trim()) patch.test_secret_key = input.testSecretKey.trim();
  if (input.testWebhookSecret.trim()) patch.test_webhook_secret = input.testWebhookSecret.trim();
  if (input.liveSecretKey.trim()) patch.live_secret_key = input.liveSecretKey.trim();
  if (input.liveWebhookSecret.trim()) patch.live_webhook_secret = input.liveWebhookSecret.trim();

  const { error } = await admin.from("payment_settings").update(patch).eq("id", 1);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/settings/payments");
  return { ok: true };
}

/** Flip the active Stripe mode (test ↔ live). */
export async function setStripeMode(mode: StripeMode): Promise<Result> {
  const { user } = await requireAdmin();
  if (mode !== "test" && mode !== "live") return { ok: false, error: "Invalid mode" };
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is not configured on the server." };

  const { error } = await admin
    .from("payment_settings")
    .update({ mode, updated_by: user.id })
    .eq("id", 1);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/settings/payments");
  return { ok: true };
}

/** Ping Stripe with the secret key for a mode to confirm it's valid. */
export async function testStripeConnection(mode: StripeMode): Promise<Result & { account?: string }> {
  await requireAdmin();
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is not configured on the server." };

  const { data } = await admin
    .from("payment_settings")
    .select("test_secret_key, live_secret_key")
    .eq("id", 1)
    .maybeSingle();
  const secret = mode === "live" ? data?.live_secret_key : data?.test_secret_key;
  if (!secret) return { ok: false, error: `No ${mode} secret key saved yet.` };

  try {
    const stripe = new Stripe(secret, { appInfo: { name: "The Raising Club" } });
    // balance.retrieve() needs no args and fails fast on a bad/expired key.
    const balance = await stripe.balance.retrieve();
    return { ok: true, account: balance.livemode ? "live account" : "test account" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Stripe connection failed" };
  }
}
