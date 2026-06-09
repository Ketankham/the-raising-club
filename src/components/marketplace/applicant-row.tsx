"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { setApplicationStatus } from "@/lib/marketplace/actions";
import type { JobApplicant } from "@/lib/marketplace/jobs";

const NEXT: { value: "shortlisted" | "hired" | "rejected"; label: string }[] = [
  { value: "shortlisted", label: "Shortlist" },
  { value: "hired", label: "Hire" },
  { value: "rejected", label: "Decline" },
];
const STATUS_LABEL: Record<string, string> = {
  applied: "Applied", reviewing: "Reviewing", shortlisted: "Shortlisted",
  hired: "Hired", rejected: "Declined", withdrawn: "Withdrawn",
};

export function ApplicantRow({ a, jobId }: { a: JobApplicant; jobId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [status, setStatus] = useState(a.status);

  const update = (s: "shortlisted" | "hired" | "rejected") =>
    start(async () => {
      const res = await setApplicationStatus(a.applicationId, s);
      if (res.ok) {
        setStatus(s);
        router.refresh();
      }
    });

  return (
    <Link href={`/dashboard/posts/${jobId}/applicants/${a.applicationId}`}>
      <div className="rounded-2xl border border-ink/10 bg-white p-4 transition hover:border-olive/30 hover:bg-cream cursor-pointer">
      <div className="flex items-start gap-3">
        {a.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.avatarUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
        ) : (
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 font-bold text-primary">{a.name[0]}</div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink">{a.name}</span>
            <span className="rounded-full bg-mint px-2 py-0.5 text-xs font-medium text-ink">{STATUS_LABEL[status] ?? status}</span>
          </div>
          {a.headline && <p className="text-sm text-ink-soft">{a.headline}</p>}
          {a.proposedRate != null && <p className="mt-1 text-sm text-olive">Proposed rate: ${a.proposedRate}/hr</p>}
          {a.coverNote && <p className="mt-2 text-sm text-ink-soft">{a.coverNote}</p>}
        </div>
      </div>
    </div>
    </Link>
  );
}
