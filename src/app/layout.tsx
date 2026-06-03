import type { Metadata } from "next";
import { cookies } from "next/headers";
import { DM_Sans, Playfair_Display, Albert_Sans } from "next/font/google";
import "./globals.css";
import { FeedbackWidget } from "@/components/feedback/feedback-widget";
import { AppFrame } from "@/components/app/app-frame";
import { BetaBanner } from "@/components/beta-banner";
import { OnboardingBanner } from "@/components/onboarding-banner";
import { ErrorBoundary } from "@/components/error-boundary";
import { GlobalErrorHandler } from "@/components/global-error-handler";
import { isBetaLocked } from "@/lib/beta";
import { createClient } from "@/lib/supabase/server";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const albertSans = Albert_Sans({
  variable: "--font-albert-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Raising Club — More than childcare",
  description:
    "Trusted care for families, real careers for caregivers, and reliable staffing and training for the programs that serve them—all inside one club.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Resolve the logged-in user's role so the global sidebar can render on every
  // page (for parent/caregiver/organization). Guests get none. NOTE: a user who
  // just finished onboarding with email-confirmation ON is still is_anonymous
  // until they confirm — but they ARE a real, registered account (registered_at
  // set) and must get the app chrome, otherwise they land on the dashboard with
  // no sidebar and no way to navigate.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let role: string | null = null;
  let unreadCount = 0;
  let onboardingIncomplete = false;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role, registered_at, onboarding_completed_at")
      .eq("id", user.id)
      .maybeSingle();
    if (data && (!user.is_anonymous || data.registered_at)) {
      role = data.role ?? null;
      // Registered but hasn't finished onboarding → nudge them (register-first).
      onboardingIncomplete =
        !!role && role !== "admin" && !!data.registered_at && !data.onboarding_completed_at;
    }
    // Unread badge for the sidebar bell (cheap count; RLS scopes it to this user).
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null);
    unreadCount = count ?? 0;
  }
  const cookieStore = await cookies();
  const expanded = cookieStore.get("trc_sidebar")?.value !== "collapsed";
  const showOnboardingBanner =
    onboardingIncomplete && cookieStore.get("trc_onboarding_banner")?.value !== "dismissed";

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${playfair.variable} ${albertSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <GlobalErrorHandler />
        {isBetaLocked() && !role && <BetaBanner />}
        {showOnboardingBanner && <OnboardingBanner />}
        <ErrorBoundary>
          <AppFrame role={role} expanded={expanded} unreadCount={unreadCount}>
            {children}
          </AppFrame>
        </ErrorBoundary>
        <FeedbackWidget />
      </body>
    </html>
  );
}
