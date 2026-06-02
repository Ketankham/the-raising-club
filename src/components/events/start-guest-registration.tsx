"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ensureGuestSession } from "@/lib/events/actions";

/**
 * Bootstraps an anonymous Supabase session for a signed-out visitor who clicked
 * "Register", then refreshes so the register page can render the wizard with a
 * real `auth.uid`. The wizard's step 0 upgrades the anon user to a permanent
 * account (register-first, onboard-later). Runs once on mount.
 */
export function StartGuestRegistration({ slug }: { slug: string }) {
  const router = useRouter();
  const ran = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    ensureGuestSession().then((res) => {
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }, [router, slug]);

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
