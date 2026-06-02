import type { SubscriberRow } from "@/lib/plans/subscribers";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  trialing: "bg-blue-100 text-blue-800",
  comp: "bg-purple-100 text-purple-800",
  past_due: "bg-amber-100 text-amber-800",
  canceled: "bg-ink/10 text-ink-soft",
  expired: "bg-ink/10 text-ink-soft",
};

function fmt(s: string | null) {
  return s ? new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
}

export function SubscribersTable({ rows, showPlan = false }: { rows: SubscriberRow[]; showPlan?: boolean }) {
  if (rows.length === 0) {
    return <p className="rounded-xl border border-ink/10 bg-white px-4 py-6 text-center text-sm text-ink-soft">No active subscribers yet.</p>;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink-soft">
            <th className="px-4 py-2.5 font-medium">Subject</th>
            {showPlan && <th className="px-4 py-2.5 font-medium">Plan</th>}
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-4 py-2.5 font-medium">Billing</th>
            <th className="px-4 py-2.5 font-medium">Start</th>
            <th className="px-4 py-2.5 font-medium">Renews / ends</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-ink/5 last:border-0">
              <td className="px-4 py-2.5">
                <div className="font-medium text-ink">{r.subjectName}</div>
                <div className="text-xs text-ink-soft">
                  {r.subjectEmail ?? `${r.subjectType}`}
                  {r.subjectType !== "user" && ` · ${r.subjectType}`}
                </div>
              </td>
              {showPlan && <td className="px-4 py-2.5 text-ink">{r.planName ?? "—"}</td>}
              <td className="px-4 py-2.5">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status] ?? "bg-ink/10 text-ink-soft"}`}>
                  {r.status}
                </span>
              </td>
              <td className="px-4 py-2.5 text-xs text-ink-soft">
                {r.source === "manual" ? "Comp" : "Stripe"} · {r.interval}
              </td>
              <td className="px-4 py-2.5 text-xs text-ink-soft">{fmt(r.startsAt)}</td>
              <td className="px-4 py-2.5 text-xs text-ink-soft">{fmt(r.endsAt ?? r.currentPeriodEnd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
