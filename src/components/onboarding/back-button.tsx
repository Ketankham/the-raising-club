"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Back control for the onboarding progress header.
 *
 * `href` is the previous step in the flow, computed server-side (browser
 * history is unreliable here — step transitions don't always create history
 * entries, so `router.back()` can leave the site). `null` hides the control
 * (e.g. right after account creation, or on completion screens).
 */
export function BackButton({ href }: { href?: string | null }) {
  const router = useRouter();
  if (href === null) return null;
  return (
    <button
      type="button"
      onClick={() => (href ? router.push(href) : router.back())}
      aria-label="Go back"
      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink transition hover:bg-ink/5"
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
}
