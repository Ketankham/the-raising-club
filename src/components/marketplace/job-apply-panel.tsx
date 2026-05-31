"use client";

import { useState } from "react";
import { ApplyModal } from "./apply-modal";

const APP_STATUS_LABEL: Record<string, string> = {
  applied: "Applied", reviewing: "Under review", shortlisted: "Shortlisted",
  hired: "Hired", rejected: "Not selected", withdrawn: "Withdrawn",
};

/** Apply CTA on the job detail page. */
export function JobApplyPanel({
  jobId,
  jobTitle,
  canApply,
  applicationStatus,
}: {
  jobId: string;
  jobTitle: string;
  canApply: boolean;
  applicationStatus: string | null;
}) {
  const [open, setOpen] = useState(false);
  if (!canApply) return null;

  return (
    <div className="mt-6">
      {applicationStatus ? (
        <span className="inline-block rounded-full bg-sage/60 px-5 py-2.5 text-sm font-semibold text-ink">
          {APP_STATUS_LABEL[applicationStatus] ?? "Applied"}
        </span>
      ) : (
        <button onClick={() => setOpen(true)} className="rounded-full bg-olive px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-95">
          Apply now
        </button>
      )}
      {!applicationStatus && <ApplyModal open={open} onClose={() => setOpen(false)} jobId={jobId} jobTitle={jobTitle} />}
    </div>
  );
}
