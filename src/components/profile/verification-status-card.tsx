"use client";

import { useState, useTransition } from "react";
import { BadgeCheck, ShieldCheck, Clock, AlertCircle, RefreshCw, ArrowRight, X } from "lucide-react";
import { startVerification, checkVerificationStatus } from "@/lib/authenticate/actions";

type VerifStatus = "not_started" | "pending" | "verified" | "failed" | "expired";

function statusOf(verifications: { type: string; status: string }[], type: string): VerifStatus {
  const v = verifications.find((v) => v.type === type);
  return (v?.status as VerifStatus) ?? "not_started";
}

function StatusPill({ status }: { status: VerifStatus }) {
  if (status === "verified")
    return <span className="inline-flex items-center gap-1 rounded-full bg-[#dcebc6] px-2.5 py-1 text-xs font-semibold text-[#4f6b15]"><BadgeCheck className="h-3 w-3" /> Verified</span>;
  if (status === "pending")
    return <span className="inline-flex items-center gap-1 rounded-full bg-[#fdeede] px-2.5 py-1 text-xs font-semibold text-[#9a5a2a]"><Clock className="h-3 w-3" /> In review</span>;
  if (status === "failed")
    return <span className="inline-flex items-center gap-1 rounded-full bg-[#fce9f0] px-2.5 py-1 text-xs font-semibold text-[#9a2a5a]"><AlertCircle className="h-3 w-3" /> Needs retry</span>;
  return <span className="rounded-full bg-white/60 px-2.5 py-1 text-xs text-ink-soft">Not started</span>;
}

/** Dismissible flash banner shown on first visit after onboarding completes. */
export function VerifyPromptBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="mb-5 flex items-start gap-3 rounded-2xl bg-[#dcebc6] px-4 py-3.5">
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#4f6b15]" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-[#3a5010]">Getting verified helps you get more clients</p>
        <p className="mt-0.5 text-xs text-[#4f6b15]">Families search for verified caregivers first. Add a Verified or Background Checked badge to stand out.</p>
      </div>
      <button onClick={() => setDismissed(true)} className="ml-1 mt-0.5 text-[#4f6b15]/60 hover:text-[#4f6b15]" aria-label="Dismiss">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Full verification status card for the profile owner view. */
export function VerificationStatusCard({
  verifications,
  hasAuthenticateUser,
  hasDob,
}: {
  verifications: { type: string; status: string }[];
  hasAuthenticateUser: boolean;
  hasDob: boolean;
}) {
  const idStatus = statusOf(verifications, "identity");
  const bgStatus = statusOf(verifications, "background_check");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  // DOB collection step — only shown on first verification attempt (when no code stored yet)
  const [showDobInput, setShowDobInput] = useState(false);
  const [dob, setDob] = useState("");

  const canStart = idStatus === "not_started" || idStatus === "failed" || idStatus === "expired";
  const needsDob = canStart && !hasAuthenticateUser && !hasDob;
  const btnLabel = hasAuthenticateUser && idStatus === "not_started"
    ? "Continue Verification"
    : idStatus === "failed"
    ? "Try Again"
    : "Start Verification";

  function handleStart() {
    // First click with no DOB stored: show the DOB input form
    if (needsDob && !showDobInput) {
      setShowDobInput(true);
      return;
    }
    setError(null);
    start(async () => {
      const res = await startVerification(needsDob ? dob : undefined);
      if (!res.ok) { setError(res.error); return; }
      // Webhook was missed but Authenticate already has the result — page reload shows verified badge
      if ('synced' in res) { window.location.reload(); return; }
      window.open(res.url, '_blank', 'noopener,noreferrer');
    });
  }

  async function handleCheck() {
    setChecking(true);
    setError(null);
    const res = await checkVerificationStatus();
    setChecking(false);
    if (!res.ok) setError(res.error);
  }

  return (
    <section className="rounded-2xl bg-white p-5" id="verify">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-[0.95rem] font-bold text-ink">Verification</h2>
        <span className="text-xs text-ink-soft">Powered by Authenticate</span>
      </div>

      <div className="flex flex-col gap-3">
        {/* Identity */}
        <div className="flex items-center justify-between gap-3 rounded-xl bg-[#faf5ee] px-3.5 py-2.5">
          <div className="flex items-center gap-2.5">
            <BadgeCheck className="h-5 w-5 text-[#4f6b15]" />
            <div>
              <p className="text-sm font-medium text-ink">Identity Verification</p>
              <p className="text-xs text-ink-soft">Government ID + liveness check</p>
            </div>
          </div>
          <StatusPill status={idStatus} />
        </div>

        {/* Background check */}
        <div className="flex items-center justify-between gap-3 rounded-xl bg-[#faf5ee] px-3.5 py-2.5">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-[#4a6b9a]" />
            <div>
              <p className="text-sm font-medium text-ink">Background Check</p>
              <p className="text-xs text-ink-soft">Criminal records · Sex offender registry</p>
            </div>
          </div>
          <StatusPill status={bgStatus} />
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      {/* DOB collection — shown only the first time, before redirecting */}
      {showDobInput && (
        <div className="mt-4 rounded-xl border border-ink/10 bg-[#faf5ee] p-3.5">
          <p className="mb-2 text-xs font-medium text-ink">Date of birth required</p>
          <p className="mb-3 text-xs text-ink-soft">Authenticate needs your date of birth to verify your identity. It is sent directly to their secure system and is not stored publicly.</p>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
            className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-[#4f6b15]/30"
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {canStart && (
          <button
            onClick={handleStart}
            disabled={pending || (showDobInput && !dob)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#4f6b15] px-4 py-1.5 text-xs font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
          >
            {pending ? "Opening…" : showDobInput ? "Continue to Verify" : btnLabel} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
        {idStatus === "pending" && (
          <button
            onClick={handleCheck}
            disabled={checking}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-3.5 py-1.5 text-xs font-medium text-ink-soft hover:text-ink disabled:opacity-60"
          >
            <RefreshCw className={`h-3 w-3 ${checking ? "animate-spin" : ""}`} /> Refresh status
          </button>
        )}
      </div>

      {(idStatus === "not_started" || idStatus === "failed") && (
        <p className="mt-3 text-xs text-ink-soft">
          Complete identity verification first, then unlock a background check for an additional trust badge.
        </p>
      )}
    </section>
  );
}
