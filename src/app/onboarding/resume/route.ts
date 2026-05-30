import { NextResponse, type NextRequest } from "next/server";
import { resolveResume } from "@/lib/onboarding/actions";

/**
 * Resume entry point (used by "Save & Continue Later" links and post-email
 * confirmation). Resolves the saved step and redirects accordingly.
 */
export async function GET(request: NextRequest) {
  const { slug, status } = await resolveResume();

  if (status === "none") {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }
  if (slug === null) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.redirect(new URL(`/onboarding/${slug}`, request.url));
}
