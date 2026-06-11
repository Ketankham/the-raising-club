import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Email-confirmation handler. Supabase confirmation links point here with a
 * `token_hash` + `type`. Verifying the OTP sets `auth.users.email_confirmed_at`,
 * which the `on_auth_user_updated` trigger mirrors into `profiles.email_confirmed_at`.
 *
 * On success we send the user back to wherever they were (`next`), defaulting to
 * the onboarding resume entry point so they continue the flow.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const rawNext = searchParams.get("next") ?? "/onboarding/resume";
  // Reject absolute URLs to prevent open-redirect attacks.
  const next = rawNext.startsWith("/") ? rawNext : "/onboarding/resume";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(
    new URL("/sign-in?error=confirmation_failed", request.url),
  );
}
