"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { acceptHouseholdInviteWithNewAccount } from "@/lib/household/actions";

const input = "w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary";

/** Condensed signup for an invited family member. On success → their Raising Club. */
export function HouseholdInviteSignup({ token, signInNext }: { token: string; signInNext: string }) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await acceptHouseholdInviteWithNewAccount({ token, firstName, email, password });
      if (res.ok) window.location.href = "/dashboard/family";
      else setError(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-3 text-left">
      <label className="block">
        <span className="mb-1 block text-xs text-ink-soft">Your name</span>
        <input className={input} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" required />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-ink-soft">Email</span>
        <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-ink-soft">Create a password</span>
        <input className={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={pending} className="mt-1 rounded-lg bg-primary px-6 py-3 font-display font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50">
        {pending ? "Joining…" : "Join the family"}
      </button>
      <Link href={`/sign-in?next=${encodeURIComponent(signInNext)}`} className="text-center text-sm font-medium text-primary hover:underline">
        I already have an account
      </Link>
    </form>
  );
}
