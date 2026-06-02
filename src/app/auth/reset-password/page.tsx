"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { SiteHeader } from "@/components/site-header";
import { Field, inputClass, ErrorText } from "@/components/onboarding/steps/ui";
import { updatePassword } from "@/lib/auth-actions";
import { createClient } from "@/lib/supabase/client";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase sends the token via URL fragment (#access_token=...&type=recovery)
    // or via PKCE code flow (?code=...). Exchange it for a session.
    const code = params.get("code");
    const hash = typeof window !== "undefined" ? window.location.hash : "";

    async function exchange() {
      const supabase = createClient();
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) { setInvalid(true); return; }
        setReady(true);
      } else if (hash.includes("type=recovery")) {
        // Legacy implicit flow: Supabase sets the session from the URL fragment automatically.
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setInvalid(true); return; }
        setReady(true);
      } else {
        setInvalid(true);
      }
    }
    void exchange();
  }, [params]);

  function submit() {
    setError(null);
    if (password !== confirm) { setError("Passwords don't match."); return; }
    start(async () => {
      const res = await updatePassword(password);
      if (!res.ok) {
        setError(res.error ?? "Something went wrong.");
      } else {
        setDone(true);
        setTimeout(() => router.push("/dashboard"), 2000);
      }
    });
  }

  if (invalid) {
    return (
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-ink/5 text-center">
        <div className="mb-4 text-4xl">⚠️</div>
        <h1 className="mb-2 font-display text-xl font-bold text-ink">Link expired</h1>
        <p className="mb-4 text-sm text-ink-soft">This password reset link is invalid or has expired.</p>
        <Link href="/forgot-password" className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-ink/5 text-center">
        <div className="mb-4 text-4xl">✅</div>
        <h1 className="mb-2 font-display text-xl font-bold text-ink">Password updated</h1>
        <p className="text-sm text-ink-soft">Redirecting you to your dashboard…</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-ink/5 text-center">
        <p className="text-sm text-ink-soft">Verifying reset link…</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-ink/5">
      <h1 className="mb-6 text-center font-display text-2xl font-bold text-ink">Set new password</h1>
      <div className="grid gap-4">
        <Field label="New password">
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </Field>
        <Field label="Confirm password">
          <input
            type="password"
            className={inputClass}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          />
        </Field>
      </div>
      <ErrorText>{error}</ErrorText>
      <button
        type="button"
        onClick={submit}
        disabled={pending || !password || !confirm}
        className="mt-6 w-full rounded-lg bg-primary px-8 py-3 font-display font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
      >
        {pending ? "Updating…" : "Update password"}
      </button>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-cream px-4 py-16">
        <Logo />
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </main>
    </>
  );
}
