"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { X, Send, Check, BadgeCheck } from "lucide-react";
import { sendCoHireInvite, getCaregiverApplicationsToMyJobs } from "@/lib/marketplace/actions";
import type { OwnJobOption } from "@/lib/marketplace/types";

/** "Invite to Co-Hire" modal (Figma slide 1). Select one+ of the viewer's own
 *  open jobs to invite this caregiver to, with an optional personal message. */
export function InviteCoHireModal({
  open,
  onClose,
  caregiver,
  jobs,
}: {
  open: boolean;
  onClose: () => void;
  caregiver: { userId: string; name: string; subline: string; avatarUrl: string | null };
  jobs: OwnJobOption[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<Record<string, string>>({});

  // When the modal opens, find which of these jobs the caregiver already applied to.
  useEffect(() => {
    if (open) getCaregiverApplicationsToMyJobs(caregiver.userId).then(setApplied).catch(() => {});
  }, [open, caregiver.userId]);

  if (!open) return null;

  const appliedCount = jobs.filter((j) => applied[j.id]).length;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = () =>
    start(async () => {
      setError(null);
      const res = await sendCoHireInvite(caregiver.userId, [...selected], message);
      if (res.ok) setDone(true);
      else setError(res.reason === "unauthenticated" ? "Please sign in again." : res.message || "Something went wrong.");
    });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-xl">
        {/* header */}
        <div className="bg-mint px-6 pb-5 pt-6">
          <div className="flex items-start justify-between">
            <h2 className="font-display text-xl font-bold text-ink">Invite to Co-Hire</h2>
            <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-white/60">
              <X size={18} />
            </button>
          </div>
          <p className="mt-1 text-sm text-ink-soft">Select one or more open jobs to invite this caregiver to.</p>
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-3">
            {caregiver.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={caregiver.avatarUrl} alt="" className="h-11 w-11 rounded-xl object-cover" />
            ) : (
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-sm font-bold text-primary">
                {caregiver.name[0]}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{caregiver.name}</p>
              <p className="truncate text-sm text-ink-soft">{caregiver.subline}</p>
            </div>
          </div>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {done ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-olive/20 text-olive">
                <Check />
              </span>
              <p className="font-semibold text-ink">Invitation sent</p>
              <p className="text-sm text-ink-soft">{caregiver.name} will see your invite in their applications.</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-2xl bg-cream p-5 text-center">
              <p className="text-sm text-ink-soft">You don&apos;t have any jobs yet. Post a job first, then invite caregivers to it.</p>
              <Link href="/dashboard/posts/new" className="mt-3 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white">
                Post a job
              </Link>
            </div>
          ) : (
            <>
              {appliedCount > 0 && (
                <div className="mb-3 flex items-center gap-2 rounded-xl bg-olive/10 px-3 py-2 text-sm font-medium text-olive">
                  <BadgeCheck className="h-4 w-4" /> {caregiver.name.split(" ")[0]} already applied to {appliedCount} of your job{appliedCount > 1 ? "s" : ""}.
                </div>
              )}
              <p className="mb-2 text-sm font-semibold text-ink">Select jobs</p>
              <div className="space-y-2">
                {jobs.map((j) => {
                  const on = selected.has(j.id);
                  return (
                    <button
                      key={j.id}
                      type="button"
                      onClick={() => toggle(j.id)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                        on ? "border-olive bg-sage/40" : "border-ink/10 bg-cream/60 hover:bg-cream"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`grid h-5 w-5 place-items-center rounded-md border ${on ? "border-olive bg-olive text-white" : "border-ink/25 bg-white"}`}>
                          {on && <Check size={13} />}
                        </span>
                        <span className="font-medium text-ink">{j.title}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        {applied[j.id] && (
                          <span className="rounded-full bg-purple/20 px-2 py-0.5 text-xs font-medium text-purple">Applied</span>
                        )}
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${j.status === "open" ? "bg-olive/20 text-olive" : "border border-ink/15 text-ink-soft"}`}>
                          {j.status === "open" ? "Active" : "Draft"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <label className="mt-5 block text-sm font-semibold text-ink">
                Personal message <span className="font-normal text-ink-soft">(optional)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Hi! We loved your profile and would be thrilled to hear from you…"
                className="mt-2 w-full rounded-2xl border border-ink/15 bg-cream/40 p-3 text-sm text-ink outline-none focus:border-olive"
              />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </>
          )}
        </div>

        {/* footer */}
        {!done && jobs.length > 0 && (
          <div className="flex items-center justify-end gap-3 border-t border-ink/5 px-6 py-4">
            <button onClick={onClose} className="text-sm font-medium text-ink-soft hover:text-ink">Cancel</button>
            <button
              onClick={submit}
              disabled={pending || selected.size === 0}
              className="inline-flex items-center gap-1.5 rounded-full bg-olive px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
            >
              <Send size={15} /> Send Invitation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
