"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { saveFamilyListing } from "@/lib/marketplace/family-actions";
import { CARE_TYPE_LABELS, CARE_TYPES, SCHEDULE_LABELS, OPEN_TO_LABELS, type CareType } from "@/lib/marketplace/format";
import { AGE_GROUPS } from "@/lib/caregiver-options";
import type { FamilyListingInput, TraitOption } from "@/lib/marketplace/types";

const AGE_KEYS = Object.keys(AGE_GROUPS);
const SCHEDULE_KEYS = Object.keys(SCHEDULE_LABELS);
const OPEN_KEYS = Object.keys(OPEN_TO_LABELS);

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export function FamilyListingForm({ initial, traitOptions }: { initial: FamilyListingInput | null; traitOptions: TraitOption[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const [f, setF] = useState<FamilyListingInput>(() => ({
    householdName: initial?.householdName ?? "",
    headline: initial?.headline ?? "",
    about: initial?.about ?? "",
    careNeeds: initial?.careNeeds ?? "",
    locationLabel: initial?.locationLabel ?? "",
    zipCode: initial?.zipCode ?? "",
    budgetMin: initial?.budgetMin ?? null,
    budgetMax: initial?.budgetMax ?? null,
    budgetUnit: initial?.budgetUnit ?? "hour",
    careType: initial?.careType ?? null,
    coverPhotoUrl: initial?.coverPhotoUrl ?? "",
    coHireInterested: initial?.coHireInterested ?? false,
    ageGroups: initial?.ageGroups ?? [],
    schedule: initial?.schedule ?? [],
    openTo: initial?.openTo ?? [],
    traits: initial?.traits ?? [],
    isPublished: initial?.isPublished ?? false,
  }));
  const set = <K extends keyof FamilyListingInput>(k: K, v: FamilyListingInput[K]) => setF((p) => ({ ...p, [k]: v }));

  function save(publish?: boolean) {
    setMsg(null);
    const payload = { ...f, isPublished: publish ?? f.isPublished };
    start(async () => {
      const res = await saveFamilyListing(payload);
      if (res.ok) {
        set("isPublished", res.published);
        setMsg(res.published ? "Saved — your family listing is now visible in Connect Families." : "Saved as private draft.");
        router.refresh();
      } else setMsg(res.message || "Something went wrong.");
    });
  }

  return (
    <div className="max-w-2xl space-y-7">
      <div className={`flex items-center gap-3 rounded-2xl p-4 ${f.isPublished ? "bg-sage/40" : "bg-cream"}`}>
        {f.isPublished ? <Eye className="h-5 w-5 text-olive" /> : <EyeOff className="h-5 w-5 text-ink-soft" />}
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink">{f.isPublished ? "Visible to others" : "Private (not listed)"}</p>
          <p className="text-xs text-ink-soft">Your listing appears in Connect Families only when published.</p>
        </div>
      </div>

      <Field label="Household name"><input value={f.householdName} onChange={(e) => set("householdName", e.target.value)} placeholder="e.g. The Alvarez" className={inp} /></Field>
      <Field label="Headline"><input value={f.headline} onChange={(e) => set("headline", e.target.value)} placeholder="A short intro line" className={inp} /></Field>
      <Field label="About your family"><textarea value={f.about} onChange={(e) => set("about", e.target.value)} rows={3} placeholder="Tell other families about you." className={inp} /></Field>
      <Field label="Care needs"><textarea value={f.careNeeds} onChange={(e) => set("careNeeds", e.target.value)} rows={3} placeholder="What kind of care or sharing are you looking for?" className={inp} /></Field>

      <Field label="Care type">
        <div className="flex flex-wrap gap-2">
          {CARE_TYPES.map((t) => <Chip key={t} on={f.careType === t} onClick={() => set("careType", f.careType === t ? null : (t as CareType))}>{CARE_TYPE_LABELS[t as CareType]}</Chip>)}
        </div>
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Budget min ($)"><input type="number" min={0} value={f.budgetMin ?? ""} onChange={(e) => set("budgetMin", e.target.value ? Number(e.target.value) : null)} className={inp} /></Field>
        <Field label="Budget max ($)"><input type="number" min={0} value={f.budgetMax ?? ""} onChange={(e) => set("budgetMax", e.target.value ? Number(e.target.value) : null)} className={inp} /></Field>
        <Field label="Per"><select value={f.budgetUnit} onChange={(e) => set("budgetUnit", e.target.value)} className={inp}><option value="hour">hour</option><option value="day">day</option><option value="week">week</option><option value="month">month</option></select></Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Location"><input value={f.locationLabel} onChange={(e) => set("locationLabel", e.target.value)} placeholder="e.g. Brooklyn, NY" className={inp} /></Field>
        <Field label="Zip code"><input value={f.zipCode} onChange={(e) => set("zipCode", e.target.value)} placeholder="11215" className={inp} /></Field>
      </div>

      <Field label="Children's ages">
        <div className="flex flex-wrap gap-2">{AGE_KEYS.map((a) => <Chip key={a} on={f.ageGroups.includes(a)} onClick={() => set("ageGroups", toggle(f.ageGroups, a))}>{AGE_GROUPS[a]}</Chip>)}</div>
      </Field>
      <Field label="Schedule">
        <div className="flex flex-wrap gap-2">{SCHEDULE_KEYS.map((s) => <Chip key={s} on={f.schedule.includes(s)} onClick={() => set("schedule", toggle(f.schedule, s))}>{SCHEDULE_LABELS[s]}</Chip>)}</div>
      </Field>
      <Field label="Open to">
        <div className="flex flex-wrap gap-2">{OPEN_KEYS.map((o) => <Chip key={o} on={f.openTo.includes(o)} onClick={() => set("openTo", toggle(f.openTo, o))}>{OPEN_TO_LABELS[o]}</Chip>)}</div>
      </Field>
      <Field label="About our home">
        <div className="flex flex-wrap gap-2">{traitOptions.map((t) => <Chip key={t.id} on={f.traits.includes(t.id)} onClick={() => set("traits", toggle(f.traits, t.id))}>{t.label}</Chip>)}</div>
      </Field>

      <Field label="Cover photo URL"><input value={f.coverPhotoUrl} onChange={(e) => set("coverPhotoUrl", e.target.value)} placeholder="https://…" className={inp} /></Field>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
        <input type="checkbox" checked={f.coHireInterested} onChange={(e) => set("coHireInterested", e.target.checked)} className="h-4 w-4 rounded accent-olive" />
        We&apos;re interested in co-hiring / a nanny share with another family
      </label>

      {msg && <p className="text-sm text-olive">{msg}</p>}

      <div className="flex flex-wrap gap-3 border-t border-ink/10 pt-5">
        {f.isPublished ? (
          <>
            <button onClick={() => save(true)} disabled={pending} className="rounded-full bg-olive px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50">{pending ? "Saving…" : "Save changes"}</button>
            <button onClick={() => save(false)} disabled={pending} className="rounded-full border border-ink/15 bg-white px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-cream disabled:opacity-50">Unpublish</button>
          </>
        ) : (
          <>
            <button onClick={() => save(true)} disabled={pending} className="rounded-full bg-olive px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50">{pending ? "Saving…" : "Publish listing"}</button>
            <button onClick={() => save(false)} disabled={pending} className="rounded-full border border-ink/15 bg-white px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-cream disabled:opacity-50">Save draft</button>
          </>
        )}
      </div>
    </div>
  );
}

const inp = "w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-olive";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><label className="mb-1.5 block text-sm font-semibold text-ink">{label}</label>{children}</div>);
}
function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (<button type="button" onClick={onClick} className={`rounded-full border px-3.5 py-1.5 text-sm transition ${on ? "border-olive bg-sage/50 text-ink" : "border-ink/15 bg-white text-ink-soft hover:border-ink/30"}`}>{children}</button>);
}
