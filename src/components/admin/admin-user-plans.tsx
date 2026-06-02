"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Gift, X } from "lucide-react";
import { assignPlanManually, revokeUserPlan } from "@/lib/plans/manual-actions";
import type { Plan } from "@/lib/plans/types";
import type { UserPlanSummary } from "@/lib/plans/user-plans";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  trialing: "bg-blue-100 text-blue-800",
  comp: "bg-purple-100 text-purple-800",
  past_due: "bg-amber-100 text-amber-800",
  canceled: "bg-ink/10 text-ink-soft",
  expired: "bg-ink/10 text-ink-soft",
  none: "bg-ink/10 text-ink-soft",
};

function fmt(s: string | null) {
  return s ? new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
}

function addMonths(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function AdminUserPlans({ userId, plans, summary }: { userId: string; plans: Plan[]; summary: UserPlanSummary }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [planKey, setPlanKey] = useState(plans.find((p) => p.price !== "free")?.key ?? plans[0]?.key ?? "");
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");
  const [startsAt, setStartsAt] = useState(new Date().toISOString().slice(0, 10));
  const [endsAt, setEndsAt] = useState(addMonths(1));
  const [notes, setNotes] = useState("");

  function assign() {
    setError(null);
    setSaved(false);
    start(async () => {
      const res = await assignPlanManually({ userId, planKey, interval, startsAt, endsAt, notes });
      if (res.ok) {
        setSaved(true);
        router.refresh();
      } else setError(res.error);
    });
  }

  function revoke(id: string) {
    start(async () => {
      await revokeUserPlan(id, userId);
      router.refresh();
    });
  }

  const snap = summary.snapshot;

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
      <h2 className="font-display text-lg font-bold text-ink">Plans &amp; entitlement</h2>
      <p className="mt-1 text-sm text-ink-soft">Live access this user has, plus a comp (no-charge) grant tool.</p>

      {/* Snapshot */}
      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-cream/60 px-4 py-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[snap.status] ?? STATUS_STYLE.none}`}>{snap.status}</span>
        <span className="text-sm font-medium text-ink">{snap.planName ?? "No active plan"}</span>
        {snap.interval && <span className="text-xs text-ink-soft">· {snap.interval}</span>}
        {snap.entitlementUntil && <span className="text-xs text-ink-soft">· until {fmt(snap.entitlementUntil)}</span>}
      </div>

      {/* Assignments */}
      {summary.assignments.length > 0 && (
        <div className="mt-5 overflow-hidden rounded-xl border border-ink/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink-soft">
                <th className="px-3 py-2 font-medium">Plan</th>
                <th className="px-3 py-2 font-medium">Via</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Window</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {summary.assignments.map((a) => (
                <tr key={a.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-3 py-2 text-ink">{a.planName ?? a.planKey ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-ink-soft">{a.source === "manual" ? "Comp" : "Stripe"} · {a.subjectType} · {a.interval}</td>
                  <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[a.status] ?? STATUS_STYLE.none}`}>{a.status}</span></td>
                  <td className="px-3 py-2 text-xs text-ink-soft">{fmt(a.startsAt)} → {fmt(a.endsAt ?? a.currentPeriodEnd)}</td>
                  <td className="px-3 py-2 text-right">
                    {a.source === "manual" && ["comp", "active", "trialing"].includes(a.status) && (
                      <button type="button" disabled={pending} onClick={() => revoke(a.id)} className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline disabled:opacity-50">
                        <X className="h-3.5 w-3.5" /> Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Comp grant form */}
      {plans.length > 0 && (
        <div className="mt-6 rounded-xl border border-ink/10 p-4">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink"><Gift className="h-4 w-4" /> Comp grant (no charge)</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-ink-soft">Plan</span>
              <select className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm" value={planKey} onChange={(e) => setPlanKey(e.target.value)}>
                {plans.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ink-soft">Billing label</span>
              <select className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm" value={interval} onChange={(e) => setInterval(e.target.value as "monthly" | "annual")}>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ink-soft">Starts</span>
              <input type="date" className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ink-soft">Ends</span>
              <div className="flex gap-2">
                <input type="date" className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
                <button type="button" onClick={() => setEndsAt(addMonths(1))} className="shrink-0 rounded-lg border border-ink/15 px-2 text-xs text-ink-soft hover:bg-ink/5">+1m</button>
                <button type="button" onClick={() => setEndsAt(addMonths(12))} className="shrink-0 rounded-lg border border-ink/15 px-2 text-xs text-ink-soft hover:bg-ink/5">+1y</button>
              </div>
            </label>
          </div>
          <label className="mt-3 block">
            <span className="mb-1 block text-xs text-ink-soft">Notes (optional)</span>
            <input className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Beta tester comp" />
          </label>
          <div className="mt-4 flex items-center gap-3">
            <button type="button" onClick={assign} disabled={pending || !planKey} className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50">
              {pending ? "Assigning…" : "Assign comp plan"}
            </button>
            {saved && <span className="inline-flex items-center gap-1 text-sm text-green-700"><Check className="h-4 w-4" /> Assigned</span>}
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </div>
      )}
    </section>
  );
}
