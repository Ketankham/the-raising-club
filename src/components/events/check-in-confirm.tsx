"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { checkInMyRegistration } from "@/lib/events/actions";

export function CheckInConfirm({ eventId, slug }: { eventId: string; slug: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ checkedInAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const confirm = () =>
    start(async () => {
      setError(null);
      const res = await checkInMyRegistration(eventId, slug);
      if (res.ok) {
        setResult({ checkedInAt: res.checkedInAt });
      } else {
        setError(
          res.reason === "not_registered"
            ? "We couldn't find your registration."
            : res.reason === "not_confirmed"
              ? "Your registration isn't confirmed yet."
              : "Something went wrong — please try again.",
        );
      }
    });

  if (result) {
    return (
      <div className="mt-6">
        <CheckCircle2 size={40} className="mx-auto text-[#5f8a36]" />
        <p className="mt-2 text-sm font-semibold text-ink">You&apos;re marked present. Enjoy!</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        disabled={pending}
        onClick={confirm}
        className="inline-flex items-center gap-2 rounded-full bg-[#9cc766] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8bb957] disabled:opacity-60"
      >
        {pending ? "Confirming…" : "Confirm I'm here"}
      </button>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
