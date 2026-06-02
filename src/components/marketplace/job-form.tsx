"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createJob, updateJob } from "@/lib/marketplace/job-actions";
import { CARE_TYPE_LABELS, CARE_TYPES, SCHEDULE_LABELS, type CareType } from "@/lib/marketplace/format";
import { AGE_GROUPS } from "@/lib/caregiver-options";
import type { JobForEdit, JobFormInput, SkillOption } from "@/lib/marketplace/types";

const AGE_KEYS = Object.keys(AGE_GROUPS);
const SCHEDULE_KEYS = Object.keys(SCHEDULE_LABELS);

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

/** Create/edit a job post (My Care Posts or Org Roles). */
export function JobForm({
  initial,
  jobId,
  skillOptions,
  orgOptions,
  defaultOrgId,
  backHref = "/dashboard/posts",
}: {
  initial?: JobForEdit;
  jobId?: string;
  skillOptions: SkillOption[];
  orgOptions: { id: string; name: string }[];
  defaultOrgId?: string;
  backHref?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [f, setF] = useState<JobFormInput>(() => ({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    careType: initial?.careType ?? null,
    ages: initial?.ages ?? [],
    schedule: initial?.schedule ?? [],
    scheduleLabel: initial?.scheduleLabel ?? "",
    payMin: initial?.payMin ?? null,
    payMax: initial?.payMax ?? null,
    payUnit: initial?.payUnit ?? "hour",
    hoursPerWeek: initial?.hoursPerWeek ?? null,
    locationLabel: initial?.locationLabel ?? "",
    zipCode: initial?.zipCode ?? "",
    startDate: initial?.startDate ?? null,
    isCoHire: initial?.isCoHire ?? false,
    openings: initial?.openings ?? 1,
    skills: initial?.skills ?? [],
    orgId: initial?.orgId ?? defaultOrgId ?? null,
    status: initial?.status ?? "draft",
  }));

  const set = <K extends keyof JobFormInput>(k: K, v: JobFormInput[K]) => setF((p) => ({ ...p, [k]: v }));

  function submit(status: "draft" | "open") {
    setError(null);
    if (!f.title.trim()) {
      setError("Please add a job title.");
      return;
    }
    start(async () => {
      const payload = { ...f, status };
      const res = jobId ? await updateJob(jobId, payload) : await createJob(payload);
      if (res.ok) router.push(backHref);
      else setError(res.message || "Something went wrong.");
    });
  }

  return (
    <div className="max-w-2xl space-y-7">
      <Field label="Job title" required>
        <input
          value={f.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. After-school Care · Mon–Thu"
          className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-olive"
        />
      </Field>

      <Field label="Description">
        <textarea
          value={f.description}
          onChange={(e) => set("description", e.target.value)}
          rows={4}
          placeholder="Describe the care you're looking for, your family, and what a good fit looks like."
          className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-olive"
        />
      </Field>

      {orgOptions.length > 0 && (
        <Field label="Post as">
          <select
            value={f.orgId ?? ""}
            onChange={(e) => set("orgId", e.target.value || null)}
            className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-olive"
          >
            <option value="">Myself (a family)</option>
            {orgOptions.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Care type">
        <div className="flex flex-wrap gap-2">
          {CARE_TYPES.map((t) => (
            <Chip key={t} on={f.careType === t} onClick={() => set("careType", f.careType === t ? null : (t as CareType))}>
              {CARE_TYPE_LABELS[t as CareType]}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Ages">
        <div className="flex flex-wrap gap-2">
          {AGE_KEYS.map((a) => (
            <Chip key={a} on={f.ages.includes(a)} onClick={() => set("ages", toggle(f.ages, a))}>
              {AGE_GROUPS[a]}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Schedule">
        <div className="mb-2 flex flex-wrap gap-2">
          {SCHEDULE_KEYS.map((s) => (
            <Chip key={s} on={f.schedule.includes(s)} onClick={() => set("schedule", toggle(f.schedule, s))}>
              {SCHEDULE_LABELS[s]}
            </Chip>
          ))}
        </div>
        <input
          value={f.scheduleLabel}
          onChange={(e) => set("scheduleLabel", e.target.value)}
          placeholder="Specifics, e.g. Mon–Thu, 3–6pm"
          className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-olive"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Pay min ($)">
          <input type="number" min={0} value={f.payMin ?? ""} onChange={(e) => set("payMin", e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-olive" />
        </Field>
        <Field label="Pay max ($)">
          <input type="number" min={0} value={f.payMax ?? ""} onChange={(e) => set("payMax", e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-olive" />
        </Field>
        <Field label="Per">
          <select value={f.payUnit} onChange={(e) => set("payUnit", e.target.value)}
            className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-olive">
            <option value="hour">hour</option>
            <option value="day">day</option>
            <option value="week">week</option>
            <option value="month">month</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Hours per week">
          <input type="number" min={0} value={f.hoursPerWeek ?? ""} onChange={(e) => set("hoursPerWeek", e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-olive" />
        </Field>
        <Field label="Openings">
          <input type="number" min={1} value={f.openings} onChange={(e) => set("openings", Number(e.target.value) || 1)}
            className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-olive" />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Location">
          <input value={f.locationLabel} onChange={(e) => set("locationLabel", e.target.value)} placeholder="e.g. Brooklyn, NY"
            className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-olive" />
        </Field>
        <Field label="Zip code">
          <input value={f.zipCode} onChange={(e) => set("zipCode", e.target.value)} placeholder="11215"
            className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-olive" />
        </Field>
      </div>

      <Field label="Start date">
        <input type="date" value={f.startDate ?? ""} onChange={(e) => set("startDate", e.target.value || null)}
          className="w-full max-w-xs rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-olive" />
      </Field>

      {skillOptions.length > 0 && (
        <Field label="Desired skills">
          <div className="flex flex-wrap gap-2">
            {skillOptions.map((s) => (
              <Chip key={s.id} on={f.skills.includes(s.id)} onClick={() => set("skills", toggle(f.skills, s.id))}>
                {s.label}
              </Chip>
            ))}
          </div>
        </Field>
      )}

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
        <input type="checkbox" checked={f.isCoHire} onChange={(e) => set("isCoHire", e.target.checked)} className="h-4 w-4 rounded accent-olive" />
        Open to co-hiring / nanny share with another family
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-3 border-t border-ink/10 pt-5">
        <button onClick={() => submit("open")} disabled={pending}
          className="rounded-full bg-olive px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50">
          {pending ? "Saving…" : jobId && initial?.status === "open" ? "Save changes" : "Post job"}
        </button>
        <button onClick={() => submit("draft")} disabled={pending}
          className="rounded-full border border-ink/15 bg-white px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-cream disabled:opacity-50">
          Save as draft
        </button>
        <button onClick={() => router.push("/dashboard/posts")} disabled={pending}
          className="px-3 py-2.5 text-sm font-medium text-ink-soft hover:text-ink">
          Cancel
        </button>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-ink">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      {children}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition ${on ? "border-olive bg-sage/50 text-ink" : "border-ink/15 bg-white text-ink-soft hover:border-ink/30"}`}>
      {children}
    </button>
  );
}
