"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { setApplicationStatus } from "@/lib/marketplace/actions";

const NEXT: { value: "shortlisted" | "hired" | "rejected"; label: string }[] = [
  { value: "shortlisted", label: "Shortlist" },
  { value: "hired", label: "Hire" },
  { value: "rejected", label: "Decline" },
];

export function ApplicantActions({
  applicationId,
  jobId,
  status,
  caregiverIdVerified = true,
  caregiverUserId,
}: {
  applicationId: string;
  jobId: string;
  status: string;
  caregiverIdVerified?: boolean;
  caregiverUserId?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [currentStatus, setCurrentStatus] = useState(status);
  const [nudgePending, setNudgePending] = useState<"shortlisted" | "hired" | null>(null);

  const update = (s: "shortlisted" | "hired" | "rejected") =>
    start(async () => {
      const res = await setApplicationStatus(applicationId, s);
      if (res.ok) {
        setCurrentStatus(s);
        setNudgePending(null);
        router.refresh();
      }
    });

  function handleClick(s: "shortlisted" | "hired" | "rejected") {
    if (!caregiverIdVerified && (s === "shortlisted" || s === "hired") && nudgePending !== s) {
      setNudgePending(s);
      return;
    }
    update(s);
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-6">
      <h3 className="mb-3 font-semibold text-ink">Actions</h3>
      <div className="flex flex-col gap-2">
        {NEXT.map((n) => (
          <button
            key={n.value}
            onClick={() => handleClick(n.value)}
            disabled={pending || currentStatus === n.value}
            className="w-full rounded-full border border-ink/15 bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-cream disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {n.label}
          </button>
        ))}
      </div>

      {nudgePending && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900">This caregiver hasn&apos;t been verified yet</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-800">
                Asking them to complete identity verification on The Raising Club reduces your risk.
                Verified caregivers have confirmed their government ID and liveness.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {caregiverUserId && (
                  <a
                    href={`/profile/${caregiverUserId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-200"
                  >
                    Ask them to verify <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <button
                  onClick={() => update(nudgePending)}
                  disabled={pending}
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink-soft border border-ink/15 hover:text-ink disabled:opacity-60"
                >
                  Continue anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
