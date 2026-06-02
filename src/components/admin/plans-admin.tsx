"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { setPlanActive } from "@/lib/plans/admin-actions";
import type { Plan, TabId } from "@/lib/plans/types";

const AUDIENCE_LABEL: Record<TabId, string> = {
  caregiver: "Caregiver & Educator",
  families: "Family",
  centers: "Centers & Programs",
};

function priceLabel(p: Plan): string {
  if (p.price === "free") return "Free";
  if (p.price === "custom") return "Custom";
  return `$${p.price}/mo${p.unit ? ` ${p.unit}` : ""}`;
}

export function PlansAdmin({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const byAudience = (["caregiver", "families", "centers"] as TabId[]).map((aud) => ({
    aud,
    plans: plans.filter((p) => p.audience === aud),
  }));

  function toggle(id: string, next: boolean) {
    start(async () => {
      await setPlanActive(id, next);
      router.refresh();
    });
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Membership plans</h1>
        <Link href="/admin/plans/new" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90">
          <Plus className="h-4 w-4" /> New plan
        </Link>
      </div>

      {byAudience.map(({ aud, plans: group }) => (
        <section key={aud} className="mb-7">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">{AUDIENCE_LABEL[aud]}</h2>
          <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
            {group.length === 0 && <p className="px-4 py-3 text-sm text-ink-soft">No plans yet.</p>}
            {group.map((p) => (
              <div key={p.id} className="flex items-center gap-3 border-b border-ink/5 px-4 py-3 last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/plans/${p.id}/edit`} className="font-medium text-ink hover:underline">{p.name}</Link>
                    {p.badge && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{p.badge}</span>}
                    {!p.isActive && <span className="rounded-full bg-ink/10 px-2 py-0.5 text-xs text-ink-soft">Hidden</span>}
                  </div>
                  <p className="text-xs text-ink-soft">
                    {priceLabel(p)} · <code className="text-ink-soft">{p.key}</code>
                    {p.adultSeats != null && ` · ${p.adultSeats} adult seats`}
                    {p.staffSeats != null && ` · ${p.staffSeats} staff seats`}
                  </p>
                </div>
                <Link href={`/admin/plans/${p.id}`} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-ink-soft hover:bg-ink/5" title="Subscribers">
                  <Users className="h-3.5 w-3.5" /> Subscribers
                </Link>
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-ink-soft">
                  <input
                    type="checkbox"
                    checked={p.isActive}
                    disabled={pending}
                    onChange={(e) => toggle(p.id, e.target.checked)}
                    className="h-4 w-4 rounded border-ink/30 text-primary"
                  />
                  Active
                </label>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
