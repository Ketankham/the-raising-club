"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { startOnboarding } from "@/lib/onboarding/actions";

/**
 * Bootstraps an anonymous Supabase session (so progress can be saved from step
 * one), then forwards to the first step. Runs once on mount.
 */
export function StartOnboarding() {
  const router = useRouter();
  const ran = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    startOnboarding().then((res) => {
      if (res.ok) {
        router.replace(`/onboarding/${res.data.currentStep}`);
      } else {
        setError(res.error);
      }
    });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      {error ? (
        <p className="text-ink-soft">Something went wrong: {error}</p>
      ) : (
        <p className="animate-pulse text-ink-soft">Setting things up…</p>
      )}
    </div>
  );
}
