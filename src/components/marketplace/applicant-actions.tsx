"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
}: {
  applicationId: string;
  jobId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [currentStatus, setCurrentStatus] = useState(status);

  const update = (s: "shortlisted" | "hired" | "rejected") =>
    start(async () => {
      const res = await setApplicationStatus(applicationId, s);
      if (res.ok) {
        setCurrentStatus(s);
        router.refresh();
      }
    });

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-6">
      <h3 className="mb-3 font-semibold text-ink">Actions</h3>
      <div className="flex flex-col gap-2">
        {NEXT.map((n) => (
          <button
            key={n.value}
            onClick={() => update(n.value)}
            disabled={pending || currentStatus === n.value}
            className="w-full rounded-full border border-ink/15 bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-cream disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {n.label}
          </button>
        ))}
      </div>
    </div>
  );
}
