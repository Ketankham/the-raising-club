"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/** Back control for the onboarding progress header. */
export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Go back"
      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink transition hover:bg-ink/5"
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
}
