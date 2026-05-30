import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_KEY } from "./env";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 *
 * Next 16: `cookies()` is async — must be awaited. Writing cookies from a
 * Server Component throws, so we swallow that case (the proxy refreshes the
 * session on the next request). Writes from Server Actions / Route Handlers
 * succeed normally.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    SUPABASE_URL!,
    SUPABASE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component — ignore; the proxy will refresh.
          }
        },
      },
    },
  );
}
