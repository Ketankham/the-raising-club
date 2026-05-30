"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { StepHeading, StepNav, Small, ErrorText, Field, inputClass, useAdvance } from "./ui";
import type { OnboardingState } from "@/lib/onboarding/state";

type Child = { pet_name: string; birth_month: string; birth_year: string };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEARS = Array.from({ length: 19 }, (_, i) => new Date().getFullYear() - i);

const empty = (): Child => ({ pet_name: "", birth_month: "", birth_year: "" });

export function ChildrenStep({ state }: { state: OnboardingState }) {
  const { advance, pending, error } = useAdvance("children");
  const [kids, setKids] = useState<Child[]>(
    ((state.answers.children as Child[] | undefined)?.length
      ? (state.answers.children as Child[])
      : [empty()]),
  );

  const update = (i: number, patch: Partial<Child>) =>
    setKids((k) => k.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const remove = (i: number) => setKids((k) => k.filter((_, idx) => idx !== i));

  function submit() {
    const cleaned = kids
      .filter((k) => k.pet_name || k.birth_month || k.birth_year)
      .map((k) => ({
        pet_name: k.pet_name || null,
        birth_month: k.birth_month ? Number(k.birth_month) : null,
        birth_year: k.birth_year ? Number(k.birth_year) : null,
      }));
    advance({ children: cleaned });
  }

  return (
    <div>
      <StepHeading
        title="Tell us about your child(ren)"
        subtitle="This helps us show age-appropriate care, groups, and events."
      />

      <div className="space-y-5">
        {kids.map((child, i) => (
          <div key={i} className="rounded-xl border border-ink/10 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display font-semibold text-ink">
                {i === 0 ? "Child" : `Child (${i + 1})`}
              </span>
              {kids.length > 1 && (
                <button type="button" onClick={() => remove(i)} className="text-ink-soft hover:text-red-600" aria-label="Remove child">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Pet name / nickname">
                <input className={inputClass} value={child.pet_name} onChange={(e) => update(i, { pet_name: e.target.value })} />
              </Field>
              <Field label="Birth month">
                <select className={inputClass} value={child.birth_month} onChange={(e) => update(i, { birth_month: e.target.value })}>
                  <option value="">Month</option>
                  {MONTHS.map((m, idx) => (
                    <option key={m} value={idx + 1}>{m}</option>
                  ))}
                </select>
              </Field>
              <Field label="Birth year">
                <select className={inputClass} value={child.birth_year} onChange={(e) => update(i, { birth_year: e.target.value })}>
                  <option value="">Year</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setKids((k) => [...k, empty()])}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover"
      >
        <Plus className="h-4 w-4" /> Add another child
      </button>

      <Small>We ask for birth month and year to match age-appropriate care and activities, while protecting your child&rsquo;s privacy.</Small>
      <ErrorText>{error}</ErrorText>
      <StepNav onContinue={submit} pending={pending} />
    </div>
  );
}
