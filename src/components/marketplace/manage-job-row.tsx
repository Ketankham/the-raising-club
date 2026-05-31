"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Users, MoreHorizontal } from "lucide-react";
import { setJobStatus, deleteJob } from "@/lib/marketplace/job-actions";
import { moneyRange } from "@/lib/marketplace/format";
import type { JobCard } from "@/lib/marketplace/types";

const STATUS_STYLE: Record<string, string> = {
  open: "bg-olive/20 text-olive",
  draft: "border border-ink/15 text-ink-soft",
  closed: "bg-ink/10 text-ink-soft",
  filled: "bg-purple/20 text-purple",
};
const STATUS_LABEL: Record<string, string> = { open: "Active", draft: "Draft", closed: "Closed", filled: "Filled" };

/** A row in My Care Posts: meta + status badge + manage actions. */
export function ManageJobRow({ job }: { job: JobCard }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [menu, setMenu] = useState(false);
  const pay = moneyRange(job.payMin, job.payMax, job.payUnit);

  const act = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      setMenu(false);
      router.refresh();
    });

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-white p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold text-ink">{job.title}</h3>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[job.status]}`}>
            {STATUS_LABEL[job.status]}
          </span>
          {job.isCoHire && <span className="rounded-full bg-sage/40 px-2 py-0.5 text-xs text-ink-soft">Co-hire</span>}
        </div>
        <p className="mt-1 truncate text-sm text-ink-soft">
          {[pay, job.scheduleLabel, job.locationLabel].filter(Boolean).join(" · ") || "No details yet"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Link href={`/dashboard/posts/${job.id}/applicants`}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-cream">
          <Users className="h-4 w-4" /> {job.applicantCount ?? 0}
        </Link>
        <Link href={`/dashboard/posts/${job.id}/edit`}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-cream">
          <Pencil className="h-4 w-4" /> Edit
        </Link>
        <div className="relative">
          <button onClick={() => setMenu((v) => !v)} aria-label="More" disabled={pending}
            className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-cream disabled:opacity-50">
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menu && (
            <div className="absolute right-0 top-9 z-20 w-40 rounded-xl border border-ink/10 bg-white py-1 shadow-lg">
              {job.status !== "open" && <MenuItem onClick={() => act(() => setJobStatus(job.id, "open"))}>Publish (Activate)</MenuItem>}
              {job.status === "open" && <MenuItem onClick={() => act(() => setJobStatus(job.id, "draft"))}>Move to draft</MenuItem>}
              {job.status !== "filled" && <MenuItem onClick={() => act(() => setJobStatus(job.id, "filled"))}>Mark filled</MenuItem>}
              {job.status !== "closed" && <MenuItem onClick={() => act(() => setJobStatus(job.id, "closed"))}>Close</MenuItem>}
              <MenuItem danger onClick={() => act(() => deleteJob(job.id))}>Delete</MenuItem>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuItem({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick}
      className={`block w-full px-3 py-2 text-left text-sm hover:bg-cream ${danger ? "text-red-600" : "text-ink"}`}>
      {children}
    </button>
  );
}
