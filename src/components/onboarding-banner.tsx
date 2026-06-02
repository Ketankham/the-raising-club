"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";

/**
 * Site-wide nudge for users who registered/created an account but haven't
 * finished onboarding ("register first, onboard later"). Rendered by the root
 * layout only when `onboarding_completed_at` is null. Dismissible (cookie) and
 * self-suppresses on the auth/onboarding routes where it would be redundant.
 */
const SUPPRESSED = ["/onboarding", "/sign-in", "/auth", "/beta"];

export function OnboardingBanner() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;
  if (SUPPRESSED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  function dismiss() {
    document.cookie = `trc_onboarding_banner=dismissed; path=/; max-age=${60 * 60 * 24 * 30}`;
    setHidden(true);
  }

  return (
    <div
      role="status"
      className="flex w-full items-center justify-center gap-3 bg-yellow px-4 py-2 text-center text-sm font-medium text-ink"
    >
      <span>
        <span aria-hidden className="mr-1.5">✨</span>
        Finish setting up your profile to get the most out of The Raising Club.{" "}
        <Link href="/onboarding/resume" className="font-semibold underline">
          Complete onboarding
        </Link>
      </span>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="rounded-full p-1 text-ink/70 transition hover:bg-black/5 hover:text-ink"
      >
        <X size={16} />
      </button>
    </div>
  );
}
