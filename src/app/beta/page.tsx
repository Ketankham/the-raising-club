import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beta testing — The Raising Club",
  description:
    "The Raising Club is currently in beta testing. New sign-ups are paused for now — please check back soon.",
};

/**
 * Landing spot for the "Get Started" CTA while the beta lock is active. The
 * proxy redirects /onboarding here on the live site, so no account is created.
 */
export default function BetaPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 py-16 text-center">
      <div className="max-w-lg">
        <span className="mb-6 inline-block rounded-full bg-primary-soft px-4 py-1.5 text-sm font-semibold text-primary">
          🧪 Beta testing
        </span>
        <h1 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">
          We are putting the finishing touches in place
        </h1>
        <p className="mt-4 text-base text-ink-soft">
          The Raising Club is currently in beta testing, so new sign-ups are
          paused for just a little while. We would love to welcome you in soon —
          please do check back again shortly.
        </p>
        <p className="mt-3 text-base text-ink-soft">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Log in here
          </Link>
          .
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-cream transition hover:bg-primary-hover"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
