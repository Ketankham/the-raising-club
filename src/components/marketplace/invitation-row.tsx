"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, DollarSign } from "lucide-react";
import { respondToInvitation } from "@/lib/marketplace/actions";
import { moneyRange } from "@/lib/marketplace/format";
import type { InvitationItem } from "@/lib/marketplace/types";

const STATUS_LABEL: Record<string, string> = {
  pending: "Invited", accepted: "Accepted", declined: "Declined", expired: "Expired", revoked: "Withdrawn",
};

export function InvitationRow({ inv }: { inv: InvitationItem }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [status, setStatus] = useState(inv.status);
  const pay = moneyRange(inv.payMin, inv.payMax, inv.payUnit);

  const respond = (s: "accepted" | "declined") =>
    start(async () => {
      const res = await respondToInvitation(inv.id, s);
      if (res.ok) { setStatus(s); router.refresh(); }
    });

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/jobs/${inv.jobId}`} className="font-semibold text-ink hover:underline">{inv.jobTitle}</Link>
            <span className="rounded-full bg-mint px-2 py-0.5 text-xs font-medium text-ink">{STATUS_LABEL[status] ?? status}</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
            {pay && <span className="flex items-center gap-1 font-semibold text-olive"><DollarSign className="h-3.5 w-3.5" />{pay}</span>}
            {inv.locationLabel && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{inv.locationLabel}</span>}
          </div>
          {inv.message && <p className="mt-2 rounded-xl bg-cream/60 p-3 text-sm text-ink-soft">“{inv.message}”</p>}
        </div>
      </div>
      {status === "pending" && (
        <div className="mt-3 flex gap-2">
          <button onClick={() => respond("accepted")} disabled={pending}
            className="rounded-full bg-olive px-4 py-1.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50">Accept</button>
          <button onClick={() => respond("declined")} disabled={pending}
            className="rounded-full border border-ink/15 px-4 py-1.5 text-sm font-medium text-ink transition hover:bg-cream disabled:opacity-50">Decline</button>
        </div>
      )}
    </div>
  );
}
