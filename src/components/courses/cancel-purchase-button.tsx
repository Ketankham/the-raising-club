"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { cancelCoursePurchase } from "@/lib/courses/actions";

/** Self-cancel a paid course purchase within the 48h window (full refund). */
export function CancelPurchaseButton({ courseId, slug }: { courseId: string; slug: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function cancel() {
    if (!confirm("Cancel this course purchase? You'll be refunded and lose access to the course.")) return;
    setErr(null);
    start(async () => {
      const r = await cancelCoursePurchase(courseId, slug);
      if (r.ok) {
        router.push(`/courses/${slug}`);
        router.refresh();
      } else {
        setErr(
          r.reason === "too_late"
            ? "The 48-hour cancellation window has passed."
            : r.reason === "free"
              ? "Free courses can't be cancelled."
              : "Could not cancel. Please try again.",
        );
      }
    });
  }

  return (
    <div className="mt-4 border-t border-black/5 pt-4">
      <button
        type="button"
        onClick={cancel}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
      >
        <X size={13} /> {pending ? "Cancelling…" : "Cancel purchase & refund"}
      </button>
      <p className="mt-1.5 text-xs text-ink-soft">Full refund within 48 hours of purchase.</p>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}
