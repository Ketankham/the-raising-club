import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserProfile } from "@/lib/guards";

export const metadata: Metadata = { title: "Complete onboarding — The Raising Club" };

/**
 * Marketplace gate popup. Reached when a register-first (not-yet-onboarded) user
 * tries to use a marketplace feature (Find Caregivers / Connect / Jobs / Chat).
 * Courses + events stay open; this only fronts the marketplace. Rendered as a
 * centered modal-style card over a dimmed backdrop. Onboarded users (and admins)
 * are bounced to the dashboard — they should never see this.
 */
export default async function CompleteOnboardingGate() {
  const { profile } = await requireUserProfile();
  if (profile.role === "admin" || profile.onboarding_completed_at) redirect("/dashboard");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-5">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-yellow text-2xl">
          ✨
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">Finish onboarding to unlock this</h1>
        <p className="mt-2 text-ink-soft">
          The Marketplace — finding caregivers, connecting with families, jobs and chat — opens up
          once your profile is set up. It only takes a couple of minutes. Courses and events stay
          open in the meantime.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/onboarding/resume"
            className="rounded-full bg-primary px-6 py-3 font-display font-semibold text-cream shadow-sm transition hover:brightness-95"
          >
            Complete onboarding
          </Link>
          <Link
            href="/events"
            className="rounded-full px-6 py-3 font-semibold text-ink-soft transition hover:text-ink"
          >
            Not now — browse events &amp; courses
          </Link>
        </div>
      </div>
    </div>
  );
}
