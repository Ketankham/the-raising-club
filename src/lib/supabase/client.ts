import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_KEY } from "./env";

/**
 * Supabase client for use in Client Components / browser code.
 * Safe to call repeatedly — the SDK dedupes the underlying client.
 */
export function createClient() {
  return createBrowserClient(SUPABASE_URL!, SUPABASE_KEY!);
}
