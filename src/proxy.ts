import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next 16 Proxy (formerly Middleware). Two jobs only — kept optimistic and
 * DB-free per the Proxy guidance; the onboarding-completion + role checks that
 * need the database live in server layouts.
 *
 *   1. Refresh the Supabase session on every matched request.
 *   2. Optimistic redirect: routes that need a *permanent* signed-in user send
 *      anonymous / signed-out visitors to /sign-in (preserving where they were
 *      headed). /onboarding is intentionally open so the wizard can create an
 *      anonymous session itself.
 */

// Routes that require a signed-in user. NOTE: /profile is intentionally absent
// so /profile/[id] stays publicly shareable; the own /profile page guards itself.
const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/connect"];

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const needsAuth = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  // Optimistic gate: only bounce when there's no session at all. We do NOT
  // bounce anonymous users here — with email confirmation ON a freshly
  // registered user stays anonymous until they confirm, and must still reach
  // their dashboard. Page-level server guards do the real role/completion check.
  if (needsAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Run on everything except static assets and image optimizer.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?)$).*)"],
};
