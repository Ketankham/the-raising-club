"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { CARE_TYPE_LABELS, type CourseCareType } from "@/lib/courses/types";
import type { CourseTaxonomyLite } from "@/lib/courses/queries";

const selectCls =
  "w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none";

export function CoursesFilters({ taxonomy }: { taxonomy: CourseTaxonomyLite }) {
  const t = useTranslations("coursesPage.filters");
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
          <SlidersHorizontal size={16} /> {t("label")}
        </span>
        <button onClick={clearAll} className="text-xs font-semibold text-primary hover:underline">
          {t("clearAll")}
        </button>
      </div>

      <div className="space-y-5">
        <div>
          <p className="mb-1.5 text-sm font-semibold text-ink">{t("contentType")}</p>
          <div className="space-y-2">
            {[
              { value: "", label: t("contentTypeAll") },
              { value: "course", label: t("contentTypeCourse") },
              { value: "bundle", label: t("contentTypeBundle") },
            ].map((o) => {
              const on = (get("type") || "") === o.value;
              return (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => setParam("type", o.value || null)}
                  aria-pressed={on}
                  className="flex w-full items-center gap-2.5 text-sm text-ink"
                >
                  <span
                    className={`grid h-[18px] w-[18px] place-items-center rounded-full border-2 transition ${
                      on ? "border-primary" : "border-ink/25"
                    }`}
                  >
                    {on && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                  </span>
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold text-ink">{t("careType")}</p>
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
          <label className="mb-1.5 block text-sm font-semibold text-ink">{t("age")}</label>
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
            <span>{t("ageMonths")}</span>
            <span className="font-semibold text-primary">
              {ageMax ? (Number(ageMax) < 24 ? `${ageMax} months` : `${Math.round(Number(ageMax) / 12)} years`) : t("ageYears")}
            </span>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">{t("category")}</label>
          <select className={selectCls} value={get("category")} onChange={(e) => setParam("category", e.target.value || null)}>
            <option value="">{t("categoryAll")}</option>
            {taxonomy.categories.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">{t("approach")}</label>
          <select className={selectCls} value={get("approach")} onChange={(e) => setParam("approach", e.target.value || null)}>
            <option value="">{t("approachAll")}</option>
            {taxonomy.approaches.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold text-ink">{t("skills")}</p>
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
