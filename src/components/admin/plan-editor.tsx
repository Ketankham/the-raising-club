"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Check } from "lucide-react";
import { createPlan, updatePlan, type PlanInput } from "@/lib/plans/admin-actions";
import type { Feature, Plan, PlanAudience } from "@/lib/plans/types";

const AUDIENCES: { value: PlanAudience; label: string }[] = [
  { value: "caregiver", label: "Caregiver & Educator" },
  { value: "families", label: "Family" },
  { value: "centers", label: "Centers & Programs" },
];

const input =
  "w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary";

function initial(plan?: Plan & { stripeProductId?: string | null }): PlanInput {
  return {
    key: plan?.key ?? "",
    audience: plan?.audience ?? "families",
    name: plan?.name ?? "",
    badge: plan?.badge ?? "",
    subtitle: plan?.subtitle ?? "",
    description: plan?.description ?? "",
    cta: plan?.cta ?? "Get Started",
    highlight: plan?.highlight ?? false,
    isFree: plan ? plan.price === "free" : false,
    isCustom: plan ? plan.price === "custom" : false,
    customLabel: plan?.customLabel ?? "",
    unit: plan?.unit ?? "",
    priceMonthly: plan?.priceMonthlyCents != null ? String(plan.priceMonthlyCents / 100) : "",
    priceAnnual: plan?.priceAnnualCents != null ? String(plan.priceAnnualCents / 100) : "",
    adultSeats: plan?.adultSeats != null ? String(plan.adultSeats) : "",
    staffSeats: plan?.staffSeats != null ? String(plan.staffSeats) : "",
    features: plan?.features?.length ? plan.features : [{ label: "", body: "" }],
    stripeProductId: plan?.stripeProductId ?? "",
    stripePriceMonthlyId: plan?.stripePriceMonthlyId ?? "",
    stripePriceAnnualId: plan?.stripePriceAnnualId ?? "",
    isActive: plan?.isActive ?? true,
    position: plan != null ? String(plan.position) : "0",
  };
}

export function PlanEditor({ plan }: { plan?: Plan & { stripeProductId?: string | null } }) {
  const router = useRouter();
  const isEdit = Boolean(plan);
  const [form, setForm] = useState<PlanInput>(initial(plan));
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof PlanInput>(key: K, value: PlanInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }
  function setFeature(i: number, patch: Partial<Feature>) {
    setForm((f) => ({ ...f, features: f.features.map((ft, j) => (j === i ? { ...ft, ...patch } : ft)) }));
  }
  const addFeature = () => setForm((f) => ({ ...f, features: [...f.features, { label: "", body: "" }] }));
  const removeFeature = (i: number) =>
    setForm((f) => ({ ...f, features: f.features.filter((_, j) => j !== i) }));

  function save() {
    setError(null);
    start(async () => {
      const res = isEdit ? await updatePlan(plan!.id, form) : await createPlan(form);
      if (res.ok) {
        setSaved(true);
        if (!isEdit) router.push("/admin/plans");
        else router.refresh();
      } else setError(res.error);
    });
  }

  const paid = !form.isFree && !form.isCustom;

  return (
    <div className="max-w-2xl">
      <Link href="/admin/plans" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All plans
      </Link>
      <h1 className="mb-6 text-xl font-semibold text-ink">{isEdit ? `Edit ${plan!.name}` : "New plan"}</h1>

      <div className="space-y-5">
        <Row label="Stable key" hint={isEdit ? "Immutable — persisted on subscriptions." : "Lowercase slug, e.g. family_access. Cannot change later."}>
          <input
            className={input}
            value={form.key}
            disabled={isEdit}
            onChange={(e) => set("key", e.target.value)}
            placeholder="family_access"
          />
        </Row>

        <Row label="Audience">
          <select className={input} value={form.audience} onChange={(e) => set("audience", e.target.value as PlanAudience)}>
            {AUDIENCES.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </Row>

        <Row label="Name">
          <input className={input} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Family Access" />
        </Row>

        <div className="grid grid-cols-2 gap-4">
          <Row label="Badge"><input className={input} value={form.badge} onChange={(e) => set("badge", e.target.value)} placeholder="Most popular" /></Row>
          <Row label="Subtitle"><input className={input} value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="Go deeper" /></Row>
        </div>

        <Row label="Description">
          <textarea className={input} rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </Row>

        <div className="grid grid-cols-2 gap-4">
          <Row label="CTA label"><input className={input} value={form.cta} onChange={(e) => set("cta", e.target.value)} /></Row>
          <Row label="Position"><input className={input} type="number" value={form.position} onChange={(e) => set("position", e.target.value)} /></Row>
        </div>

        <div className="flex flex-wrap gap-5 rounded-lg border border-ink/10 bg-white p-4">
          <Checkbox label="Highlighted card" checked={form.highlight} onChange={(v) => set("highlight", v)} />
          <Checkbox label="Free plan" checked={form.isFree} onChange={(v) => set("isFree", v)} />
          <Checkbox label="Custom pricing" checked={form.isCustom} onChange={(v) => set("isCustom", v)} />
          <Checkbox label="Active" checked={form.isActive} onChange={(v) => set("isActive", v)} />
        </div>

        {form.isCustom && (
          <Row label="Custom label"><input className={input} value={form.customLabel} onChange={(e) => set("customLabel", e.target.value)} placeholder="Contact us to design your program." /></Row>
        )}

        {paid && (
          <div className="grid grid-cols-3 gap-4">
            <Row label="Monthly ($)"><input className={input} type="number" value={form.priceMonthly} onChange={(e) => set("priceMonthly", e.target.value)} /></Row>
            <Row label="Annual ($/yr)"><input className={input} type="number" value={form.priceAnnual} onChange={(e) => set("priceAnnual", e.target.value)} /></Row>
            <Row label="Unit"><input className={input} value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="per site" /></Row>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Row label="Adult seats" hint="Family seat limit"><input className={input} type="number" value={form.adultSeats} onChange={(e) => set("adultSeats", e.target.value)} /></Row>
          <Row label="Staff seats" hint="Org seat limit"><input className={input} type="number" value={form.staffSeats} onChange={(e) => set("staffSeats", e.target.value)} /></Row>
        </div>

        {/* Features */}
        <div>
          <p className="mb-2 text-sm font-medium text-ink">Features</p>
          <div className="space-y-3">
            {form.features.map((f, i) => (
              <div key={i} className="rounded-lg border border-ink/10 bg-white p-3">
                <div className="mb-2 flex items-center gap-2">
                  <input className={input} value={f.label} onChange={(e) => setFeature(i, { label: e.target.value })} placeholder="Feature label" />
                  <button type="button" onClick={() => removeFeature(i)} className="shrink-0 rounded-md p-2 text-ink-soft hover:bg-ink/5 hover:text-red-600" aria-label="Remove feature">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <textarea className={input} rows={2} value={f.body} onChange={(e) => setFeature(i, { body: e.target.value })} placeholder="Feature body" />
              </div>
            ))}
          </div>
          <button type="button" onClick={addFeature} className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
            <Plus className="h-4 w-4" /> Add feature
          </button>
        </div>

        {/* Stripe */}
        <details className="rounded-lg border border-ink/10 bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium text-ink">Stripe price IDs</summary>
          <div className="mt-3 space-y-3">
            <Row label="Product ID"><input className={input} value={form.stripeProductId} onChange={(e) => set("stripeProductId", e.target.value)} placeholder="prod_…" /></Row>
            <div className="grid grid-cols-2 gap-4">
              <Row label="Monthly price ID"><input className={input} value={form.stripePriceMonthlyId} onChange={(e) => set("stripePriceMonthlyId", e.target.value)} placeholder="price_…" /></Row>
              <Row label="Annual price ID"><input className={input} value={form.stripePriceAnnualId} onChange={(e) => set("stripePriceAnnualId", e.target.value)} placeholder="price_…" /></Row>
            </div>
          </div>
        </details>

        <div className="flex items-center gap-3">
          <button type="button" onClick={save} disabled={pending} className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50">
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create plan"}
          </button>
          {saved && <span className="inline-flex items-center gap-1 text-sm text-green-700"><Check className="h-4 w-4" /> Saved</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </div>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}{hint && <em className="ml-2 not-italic text-xs font-normal text-ink-soft">{hint}</em>}</span>
      {children}
    </label>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-ink/30 text-primary" />
      {label}
    </label>
  );
}
