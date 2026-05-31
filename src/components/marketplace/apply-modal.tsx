"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Check } from "lucide-react";
import { applyToJob } from "@/lib/marketplace/actions";

/** Apply to a job: optional cover note + proposed rate. */
export function ApplyModal({
  open,
  onClose,
  jobId,
  jobTitle,
}: {
  open: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [rate, setRate] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const submit = () =>
    start(async () => {
      setError(null);
      const res = await applyToJob(jobId, note, rate ? Number(rate) : null);
      if (res.ok) {
        setDone(true);
        router.refresh();
      } else if (res.reason === "already_applied") setError("You've already applied to this job.");
      else if (res.reason === "unauthenticated") router.push("/sign-in?next=/jobs");
      else setError(res.message || "Something went wrong.");
    });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="flex items-start justify-between bg-mint px-6 pb-5 pt-6">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Apply to this job</h2>
            <p className="mt-0.5 text-sm text-ink-soft">{jobTitle}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-white/60">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-olive/20 text-olive"><Check /></span>
            <p className="font-semibold text-ink">Application sent</p>
            <p className="text-sm text-ink-soft">You can track it under My Applications.</p>
            <button onClick={onClose} className="mt-3 rounded-full bg-olive px-5 py-2 text-sm font-semibold text-white">Done</button>
          </div>
        ) : (
          <div className="px-6 py-5">
            <label className="block text-sm font-semibold text-ink">Message to the family <span className="font-normal text-ink-soft">(optional)</span></label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4}
              placeholder="Introduce yourself and why you'd be a great fit…"
              className="mt-2 w-full rounded-2xl border border-ink/15 bg-cream/40 p-3 text-sm text-ink outline-none focus:border-olive" />

            <label className="mt-4 block text-sm font-semibold text-ink">Your proposed rate ($/hr) <span className="font-normal text-ink-soft">(optional)</span></label>
            <input type="number" min={0} value={rate} onChange={(e) => setRate(e.target.value)} placeholder="e.g. 28"
              className="mt-2 w-40 rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-olive" />

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-5 flex items-center justify-end gap-3 border-t border-ink/5 pt-4">
              <button onClick={onClose} className="text-sm font-medium text-ink-soft hover:text-ink">Cancel</button>
              <button onClick={submit} disabled={pending}
                className="rounded-full bg-olive px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50">
                {pending ? "Sending…" : "Send application"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
