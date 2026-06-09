"use client";

import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithPassword } from "@/lib/onboarding/actions";
import { Logo } from "@/components/logo";
import { SiteHeader } from "@/components/site-header";
import { Field, inputClass, ErrorText } from "@/components/onboarding/steps/ui";

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit() {
    setError(null);
    start(async () => {
      const res = await signInWithPassword({ email, password });
      if (!res.ok) return setError(res.error);
      router.push(next);
      router.refresh();
    });
  }

  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-ink/5">
      <h1 className="mb-6 text-center font-display text-2xl font-bold text-ink">Welcome back</h1>
      <div className="grid gap-4">
        <Field label="Email">
          <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <input type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
      </div>
      <div className="mt-1 text-right">
        <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot password?</Link>
      </div>
      <ErrorText>{error}</ErrorText>
      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="mt-6 w-full rounded-lg bg-primary px-8 py-3 font-display font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="mt-4 text-center text-sm text-ink-soft">
        New here?{" "}
        <Link href="/onboarding" className="font-medium text-primary hover:underline">
          Get started
        </Link>
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-cream px-4 py-16">
        <Logo />
        <Suspense>
          <SignInForm />
        </Suspense>
      </main>
    </>
  );
}
