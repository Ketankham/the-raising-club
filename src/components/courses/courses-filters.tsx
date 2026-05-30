"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { CARE_TYPE_LABELS, type CourseCareType } from "@/lib/courses/types";
import type { CourseTaxonomyLite } from "@/lib/courses/queries";

const selectCls =
  "w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none";

export function CoursesFilters({ taxonomy }: { taxonomy: CourseTaxonomyLite }) {
  const router = useRouter();
  const sp = useSearchParams();

  const get = (k: string) => sp.get(k) ?? "";
  const skills = (sp.get("skills") ?? "").split(",").filter(Boolean);

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(sp.toString());
    if (v) next.set(k, v);
    else next.delete(k);
    router.push(`/courses?${next.toString()}`);
  };

  const toggleSkill = (id: string) => {
    const next = skills.includes(id) ? skills.filter((s) => s !== id) : [...skills, id];
    setParam("skills", next.join(",") || null);
  };

  const clearAll = () => router.push("/courses");
  const ageMax = get("ageMax");

  return (
    <aside className="rounded-2xl bg-[#fbe9d6]/60 p-4 lg:sticky lg:top-20">
      <div className="mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2 font-display font-bold text-ink">
          <SlidersHorizontal size={16} /> Filters
        </span>
        <button onClick={clearAll} className="text-xs font-semibold text-primary hover:underline">
          Clear all
        </button>
      </div>

      <div className="space-y-5">
        <div>
          <p className="mb-1.5 text-sm font-semibold text-ink">Care type</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CARE_TYPE_LABELS) as CourseCareType[]).map((k) => {
              const on = get("care") === k;
              return (
                <button
                  key={k}
                  onClick={() => setParam("care", on ? null : k)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    on ? "border-primary bg-primary/10 text-primary" : "border-ink/15 bg-white text-ink-soft hover:border-ink/30"
                  }`}
                >
                  {CARE_TYPE_LABELS[k]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Age (up to)</label>
          <input
            type="range"
            min={0}
            max={144}
            step={6}
            value={ageMax || 144}
            onChange={(e) => setParam("ageMax", e.target.value === "144" ? null : e.target.value)}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-ink-soft">
            <span>0 months</span>
            <span className="font-semibold text-primary">
              {ageMax ? (Number(ageMax) < 24 ? `${ageMax} months` : `${Math.round(Number(ageMax) / 12)} years`) : "12 years"}
            </span>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Category</label>
          <select className={selectCls} value={get("category")} onChange={(e) => setParam("category", e.target.value || null)}>
            <option value="">All categories</option>
            {taxonomy.categories.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Approach</label>
          <select className={selectCls} value={get("approach")} onChange={(e) => setParam("approach", e.target.value || null)}>
            <option value="">All approaches</option>
            {taxonomy.approaches.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold text-ink">Skills</p>
          <div className="flex flex-wrap gap-2">
            {taxonomy.skills.map((s) => {
              const on = skills.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleSkill(s.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    on ? "border-primary bg-primary/10 text-primary" : "border-ink/15 bg-white text-ink-soft hover:border-ink/30"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
