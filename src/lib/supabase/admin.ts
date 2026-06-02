import "server-only";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

/**
 * Service-role Supabase client — BYPASSES RLS. Server-only.
 *
 * Used by the Stripe webhook and other account-less / privileged writes
 * (payment settings, billing sync, comp-grant assignment) where RLS expects a
 * service-role actor. NEVER import this into a client component or expose its
 * results without re-checking authorization yourself.
 *
 * Reads SUPABASE_SERVICE_ROLE_KEY (server-only env). Returns null if unset so
 * callers can fail soft / surface a clear "billing not configured" message.
 */
export function createAdminClient(): SupabaseClient | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !serviceKey) return null;
  return createSupabaseClient(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
