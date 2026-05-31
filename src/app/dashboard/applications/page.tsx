import Link from "next/link";
import { FileText } from "lucide-react";
import { listMyApplications, listMyInvitations } from "@/lib/marketplace/applications";
import { InvitationRow } from "@/components/marketplace/invitation-row";
import { moneyRange } from "@/lib/marketplace/format";

const APP_STATUS_LABEL: Record<string, string> = {
  applied: "Applied", reviewing: "Under review", shortlisted: "Shortlisted",
  hired: "Hired", rejected: "Not selected", withdrawn: "Withdrawn",
};

/** My Applications — the caregiver's applications + received co-hire invitations. */
export default async function MyApplicationsPage() {
  const [apps, invites] = await Promise.all([listMyApplications(), listMyInvitations()]);
  const pendingInvites = invites.filter((i) => i.status === "pending");

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-ink">My Applications</h1>
      <p className="mt-1.5 text-ink-soft">Track the jobs you&apos;ve applied to and invitations from families.</p>

      {invites.length > 0 && (
        <section className="mt-7">
          <h2 className="mb-3 font-display text-lg font-bold text-ink">
            Co-hire invitations {pendingInvites.length > 0 && <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-white">{pendingInvites.length} new</span>}
          </h2>
          <div className="space-y-3">
            {invites.map((i) => (
              <InvitationRow key={i.id} inv={i} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-7">
        <h2 className="mb-3 font-display text-lg font-bold text-ink">Applications</h2>
        {apps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/15 bg-white/50 p-12 text-center">
            <FileText className="mx-auto h-8 w-8 text-ink-soft/50" />
            <p className="mt-3 font-display text-lg font-bold text-ink">No applications yet</p>
            <p className="mt-1 text-sm text-ink-soft">Browse open jobs and apply to start tracking them here.</p>
            <Link href="/jobs" className="mt-4 inline-block rounded-full bg-olive px-5 py-2.5 text-sm font-semibold text-white">Find Jobs</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {apps.map((a) => {
              const pay = moneyRange(a.payMin, a.payMax, a.payUnit);
              return (
                <div key={a.id} className="flex items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-white p-4">
                  <div className="min-w-0">
                    <Link href={`/jobs/${a.jobId}`} className="font-semibold text-ink hover:underline">{a.jobTitle}</Link>
                    <p className="mt-0.5 truncate text-sm text-ink-soft">
                      {[pay, a.locationLabel, a.proposedRate != null ? `Asked $${a.proposedRate}/hr` : null].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-mint px-3 py-1 text-sm font-medium text-ink">{APP_STATUS_LABEL[a.status] ?? a.status}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
