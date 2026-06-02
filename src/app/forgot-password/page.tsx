"use client";

import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { SiteHeader } from "@/components/site-header";
import { Field, inputClass, ErrorText } from "@/components/onboarding/steps/ui";
import { requestPasswordReset } from "@/lib/auth-actions";

function ForgotPasswordForm() {
  const [pending, start] = useTransition();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    start(async () => {
      const res = await requestPasswordReset(email);
      if (!res.ok) {
        setError(res.error ?? "Something went wrong.");
      } else {
        setSent(true);
      }
    });
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-ink/5 text-center">
        <div className="mb-4 text-4xl">📬</div>
        <h1 className="mb-2 font-display text-xl font-bold text-ink">Check your email</h1>
        <p className="text-sm text-ink-soft">
          If <strong>{email}</strong> is registered, we sent a password reset link. Check your inbox and spam folder.
        </p>
        <Link
          href="/sign-in"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-ink/5">
      <h1 className="mb-2 text-center font-display text-2xl font-bold text-ink">Forgot password?</h1>
      <p className="mb-6 text-center text-sm text-ink-soft">
        Enter your email and we&apos;ll send you a reset link.
      </p>
      <Field label="Email">
        <input
          type="email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder="you@example.com"
        />
      </Field>
      <ErrorText>{error}</ErrorText>
      <button
        type="button"
        onClick={submit}
        disabled={pending || !email.trim()}
        className="mt-6 w-full rounded-lg bg-primary px-8 py-3 font-display font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send reset link"}
      </button>
      <p className="mt-4 text-center text-sm text-ink-soft">
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-cream px-4 py-16">
        <Logo />
        <Suspense>
          <ForgotPasswordForm />
        </Suspense>
      </main>
    </>
  );
}
