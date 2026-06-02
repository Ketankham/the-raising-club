"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, X } from "lucide-react";
import { adminCancelCourseEnrollment } from "@/lib/courses/admin-actions";
import type { CourseEnrollee } from "@/lib/courses/admin";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-[#eef6e3] text-[#5f8a36]",
  completed: "bg-lavender text-ink",
  cancelled: "bg-pink text-[#a02c4a]",
};

function money(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency || "usd").toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

function PaymentChip({ e }: { e: CourseEnrollee }) {
  if (e.amountCents == null) {
    return <span className="rounded-full bg-lavender px-2.5 py-0.5 text-xs font-semibold text-ink-soft">Free</span>;
  }
  const refunded = e.refundedAmountCents > 0 || e.status === "cancelled";
  const label = refunded
    ? `Refunded ${money(e.refundedAmountCents || e.amountCents, e.currency ?? "usd")}`
    : `Paid ${money(e.amountCents, e.currency ?? "usd")}`;
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${refunded ? "bg-lavender text-ink-soft" : "bg-[#eef6e3] text-[#5f8a36]"}`}>
      {label}
    </span>
  );
}

export function EnrolleesView({ enrollees, courseId }: { enrollees: CourseEnrollee[]; courseId: string }) {
  if (enrollees.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/15 bg-white/50 p-10 text-center text-sm text-ink-soft">
        No enrollees yet.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-soft">{enrollees.length} {enrollees.length === 1 ? "enrollee" : "enrollees"}</p>
      {enrollees.map((e) => (
        <EnrolleeRow key={e.enrollmentId} e={e} courseId={courseId} />
      ))}
    </div>
  );
}

function EnrolleeRow({ e, courseId }: { e: CourseEnrollee; courseId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(e.status);
  const [pending, start] = useTransition();
  const isCancelled = status === "cancelled";
  const isPaid = e.amountCents != null;

  const cancel = () => {
    if (!confirm(isPaid ? "Cancel this purchase and refund the learner?" : "Cancel this enrollment?")) return;
    start(async () => {
      const res = await adminCancelCourseEnrollment(e.enrollmentId, courseId);
      if (res.ok) {
        setStatus("cancelled");
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-ink">
        <span className="font-display font-bold">{e.name || "Learner"}</span>
        {e.email && (
          <span className="flex items-center gap-1 text-ink-soft">
            <Mail size={13} /> {e.email}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <PaymentChip e={e} />
        {!isCancelled && isPaid && (
          <button
            type="button"
            disabled={pending}
            onClick={cancel}
            className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            <X size={13} /> Cancel &amp; refund
          </button>
        )}
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[status] ?? "bg-lavender text-ink-soft"}`}>
          {status}
        </span>
      </div>
    </div>
  );
}
