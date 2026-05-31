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

export function ApplicantRow({ a }: { a: JobApplicant }) {
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
    <div className="rounded-2xl border border-ink/10 bg-white p-4">
      <div className="flex items-start gap-3">
        {a.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.avatarUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
        ) : (
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 font-bold text-primary">{a.name[0]}</div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${a.caregiverUserId}`} className="font-semibold text-ink hover:underline">{a.name}</Link>
            <span className="rounded-full bg-mint px-2 py-0.5 text-xs font-medium text-ink">{STATUS_LABEL[status] ?? status}</span>
          </div>
          {a.headline && <p className="text-sm text-ink-soft">{a.headline}</p>}
          {a.proposedRate != null && <p className="mt-1 text-sm text-olive">Proposed rate: ${a.proposedRate}/hr</p>}
          {a.coverNote && <p className="mt-2 text-sm text-ink-soft">{a.coverNote}</p>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={`/chat/new?to=${a.caregiverUserId}&ctxType=application&ctxId=${a.applicationId}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-olive px-3 py-1.5 text-sm font-semibold text-white transition hover:brightness-95">
          <MessageCircle className="h-4 w-4" /> Message
        </a>
        {NEXT.map((n) => (
          <button key={n.value} onClick={() => update(n.value)} disabled={pending || status === n.value}
            className="rounded-full border border-ink/15 px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-cream disabled:opacity-40">
            {n.label}
          </button>
        ))}
      </div>
    </div>
  );
}
