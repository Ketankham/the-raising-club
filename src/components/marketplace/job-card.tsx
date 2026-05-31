"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, DollarSign, Clock, Users, CalendarDays } from "lucide-react";
import { SaveButton } from "./save-button";
import { ApplyModal } from "./apply-modal";
import { moneyRange, SCHEDULE_LABELS, AGE_GROUP_TAGS } from "@/lib/marketplace/format";
import type { JobCard as Job } from "@/lib/marketplace/types";

const APP_STATUS_LABEL: Record<string, string> = {
  applied: "Applied", reviewing: "Under review", shortlisted: "Shortlisted",
  hired: "Hired", rejected: "Not selected", withdrawn: "Withdrawn",
};

/** Job result card (Find Jobs). Caregivers can apply; shows application status
 *  if they already applied. */
export function JobCard({ job, canApply }: { job: Job; canApply: boolean }) {
  const [applyOpen, setApplyOpen] = useState(false);
  const pay = moneyRange(job.payMin, job.payMax, job.payUnit);
  const applied = !!job.myApplicationStatus;

  return (
    <div className="relative flex flex-col rounded-2xl bg-mint/60 p-5 transition hover:shadow-md">
      <SaveButton targetType="job" targetId={job.id} initialSaved={job.isSaved ?? false} revalidate="/jobs" signInNext="/jobs" className="absolute right-3 top-3" />

      <div className="pr-10">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/jobs/${job.id}`} className="font-display text-lg font-bold text-ink hover:underline">{job.title}</Link>
          {job.isCoHire && <span className="rounded-full bg-sage/50 px-2 py-0.5 text-xs font-medium text-ink">Co-hire</span>}
        </div>
        {job.locationLabel && (
          <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-soft">
            <MapPin className="h-3.5 w-3.5" /> {job.locationLabel}
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-ink-soft">
        {pay && <span className="flex items-center gap-1 font-semibold text-olive"><DollarSign className="h-3.5 w-3.5" />{pay}</span>}
        {job.hoursPerWeek != null && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{job.hoursPerWeek} hrs/wk</span>}
        {job.openings > 1 && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{job.openings} openings</span>}
        {job.scheduleLabel && <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{job.scheduleLabel}</span>}
      </div>

      {job.description && <p className="mt-3 line-clamp-2 text-sm text-ink-soft">{job.description}</p>}

      {(job.ages.length > 0 || job.skills.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.ages.map((a) => (
            <span key={a} className="rounded-full border border-ink/15 bg-white/70 px-2.5 py-0.5 text-xs text-ink-soft">{AGE_GROUP_TAGS[a] ?? a}</span>
          ))}
          {job.schedule.map((s) => (
            <span key={s} className="rounded-full border border-ink/15 bg-white/70 px-2.5 py-0.5 text-xs text-ink-soft">{SCHEDULE_LABELS[s] ?? s}</span>
          ))}
          {job.skills.slice(0, 3).map((s) => (
            <span key={s} className="rounded-full border border-ink/15 bg-white/70 px-2.5 py-0.5 text-xs text-ink-soft">{s}</span>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Link href={`/jobs/${job.id}`} className="flex-1 rounded-full border border-ink/15 bg-white py-2 text-center text-sm font-semibold text-ink transition hover:bg-cream">
          View details
        </Link>
        {canApply &&
          (applied ? (
            <span className="flex-1 rounded-full bg-sage/50 py-2 text-center text-sm font-semibold text-ink">
              {APP_STATUS_LABEL[job.myApplicationStatus!] ?? "Applied"}
            </span>
          ) : (
            <button onClick={() => setApplyOpen(true)} className="flex-1 rounded-full bg-olive py-2 text-center text-sm font-semibold text-white transition hover:brightness-95">
              Apply
            </button>
          ))}
      </div>

      {canApply && !applied && (
        <ApplyModal open={applyOpen} onClose={() => setApplyOpen(false)} jobId={job.id} jobTitle={job.title} />
      )}
    </div>
  );
}
