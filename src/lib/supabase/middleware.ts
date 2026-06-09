import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_KEY } from "./env";

/**
 * Refreshes the Supabase auth session on every request and returns the user.
 *
 * IMPORTANT (Supabase + SSR): we must call `getUser()` here so expired access
 * tokens are refreshed and the new cookies are written onto the response.
 * Keep this free of heavy DB queries — authorization that needs the database
 * belongs in server layouts (per Next 16 Proxy guidance).
 */
export async function updateSession(request: NextRequest, baseResponse?: NextResponse) {
  let response = baseResponse || NextResponse.next({ request });

  // Fail open: if Supabase isn't configured (or a transient error occurs) we
  // must never take the whole site down — just skip session refresh.
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { response, user: null };
  }

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { response, user };
  } catch {
    // Supabase unreachable — fail open rather than 500 every request.
    return { response, user: null };
  }
}
