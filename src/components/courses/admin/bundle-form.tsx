"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Check } from "lucide-react";
import { saveBundle } from "@/lib/courses/admin-actions";
import type { BundleInput } from "@/lib/courses/types";

const inputCls =
  "w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-primary focus:outline-none";

export function BundleForm({
  initial,
  courses,
}: {
  initial: BundleInput;
  courses: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [b, setB] = useState<BundleInput>(initial);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const patch = (p: Partial<BundleInput>) => setB((s) => ({ ...s, ...p }));

  const toggleCourse = (id: string) =>
    patch({ courseIds: b.courseIds.includes(id) ? b.courseIds.filter((x) => x !== id) : [...b.courseIds, id] });

  const submit = () =>
    start(async () => {
      setErr(null);
      const res = await saveBundle(b);
      if (res.ok) router.push("/admin/courses/bundles");
      else setErr(res.message ?? `Could not save (${res.reason}).`);
    });

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <div className="grid gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink">Title</span>
            <input className={inputCls} value={b.title} onChange={(e) => patch({ title: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink">Summary</span>
            <textarea className={inputCls} rows={2} value={b.summary} onChange={(e) => patch({ summary: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink">Description</span>
            <textarea className={inputCls} rows={3} value={b.description} onChange={(e) => patch({ description: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink">Cover image URL</span>
            <input className={inputCls} value={b.coverImageUrl} onChange={(e) => patch({ coverImageUrl: e.target.value })} placeholder="https://…" />
          </label>
          <div className="flex flex-wrap items-center gap-5">
            <label className="flex items-center gap-2 text-sm font-medium text-ink">
              <input type="checkbox" checked={b.isFree} onChange={(e) => patch({ isFree: e.target.checked })} /> Free
            </label>
            {!b.isFree && (
              <>
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-ink">Price (cents)</span>
                  <input type="number" min={0} className={inputCls} value={b.priceCents} onChange={(e) => patch({ priceCents: Number(e.target.value) })} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-ink">Compare-at (cents)</span>
                  <input type="number" min={0} className={inputCls} value={b.compareAtPriceCents ?? ""} onChange={(e) => patch({ compareAtPriceCents: e.target.value ? Number(e.target.value) : null })} />
                </label>
              </>
            )}
            <label className="flex items-center gap-2 text-sm font-medium text-ink">
              <input type="checkbox" checked={b.isFeatured} onChange={(e) => patch({ isFeatured: e.target.checked })} /> Featured
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-ink">Status</span>
              <select className={`${inputCls} w-auto`} value={b.status} onChange={(e) => patch({ status: e.target.value as BundleInput["status"] })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <h2 className="mb-1 font-display text-lg font-bold text-ink">Courses in this path</h2>
        <p className="mb-4 text-sm text-ink-soft">Pick the courses this learning path includes.</p>
        <div className="space-y-2">
          {courses.map((c) => {
            const on = b.courseIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCourse(c.id)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm transition ${
                  on ? "border-primary bg-primary/5 text-ink" : "border-ink/10 text-ink-soft hover:border-ink/25"
                }`}
              >
                <span className="font-medium">{c.title}</span>
                {on && <Check size={16} className="text-primary" />}
              </button>
            );
          })}
          {courses.length === 0 && <p className="text-sm text-ink-soft">No courses to add yet.</p>}
        </div>
      </section>

      {err && <p className="text-sm text-red-600">{err}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
      >
        <Save size={16} /> {pending ? "Saving…" : "Save learning path"}
      </button>
    </div>
  );
}
