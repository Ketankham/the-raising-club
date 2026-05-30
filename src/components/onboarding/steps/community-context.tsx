"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { StepHeading, StepNav, SingleSelect, MultiSelect, Field, Small, ErrorText, inputClass, useAdvance, useSaveLater, type Option } from "./ui";
import type { OnboardingState } from "@/lib/onboarding/state";

const YESNO: Option[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const PATTERN: Option[] = [
  { value: "one_or_few", label: "I work with one child or a small number of children (1–3)" },
  { value: "groups", label: "I work with groups of children (classroom, center, after-school, program)" },
  { value: "varies", label: "It varies (I work with different children week to week)" },
];

const SETTING: Option[] = [
  { value: "daycare", label: "Daycare / Childcare center" },
  { value: "preschool", label: "Preschool" },
  { value: "afterschool", label: "After-school program" },
  { value: "enrichment", label: "Enrichment program" },
  { value: "other", label: "Other" },
];

const AGES: Option[] = [
  { value: "infant", label: "Infants (0–12 months)" },
  { value: "toddler", label: "Toddlers (1–3 years)" },
  { value: "preschool", label: "Preschool (3–5 years)" },
  { value: "school_age", label: "School-age (5–10 years)" },
  { value: "preteen", label: "Preteen / Middle school (11+)" },
];

const SIZE: Option[] = [
  { value: "1_5", label: "1–5" },
  { value: "6_10", label: "6–10" },
  { value: "11_15", label: "11–15" },
  { value: "16_plus", label: "16+" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEARS = Array.from({ length: 19 }, (_, i) => new Date().getFullYear() - i);
type Child = { pet_name: string; birth_month: string; birth_year: string };
const emptyChild = (): Child => ({ pet_name: "", birth_month: "", birth_year: "" });

export function CommunityContextStep({ state }: { state: OnboardingState }) {
  const { advance, pending, error } = useAdvance("community-context");
  const saveLater = useSaveLater();

  const [working, setWorking] = useState<string | null>(
    state.answers.currentlyWorking === undefined ? null : state.answers.currentlyWorking ? "yes" : "no",
  );
  const [pattern, setPattern] = useState<string | null>((state.answers.pattern as string) ?? null);
  const [setting, setSetting] = useState<string | null>((state.answers.setting as string) ?? null);
  const [size, setSize] = useState<string | null>((state.answers.size as string) ?? null);
  const [ages, setAges] = useState<string[]>((state.answers.contextAges as string[]) ?? []);
  const [kids, setKids] = useState<Child[]>(((state.answers.contextChildren as Child[]) ?? [emptyChild()]));

  const updateKid = (i: number, patch: Partial<Child>) => setKids((k) => k.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  function data() {
    return {
      currentlyWorking: working === "yes",
      pattern: working === "yes" ? pattern : null,
      setting: pattern === "groups" ? setting : null,
      size: pattern === "groups" ? size : null,
      contextAges: pattern === "groups" || pattern === "varies" ? ages : [],
      contextChildren:
        pattern === "one_or_few"
          ? kids
              .filter((k) => k.pet_name || k.birth_month || k.birth_year)
              .map((k) => ({
                pet_name: k.pet_name || null,
                birth_month: k.birth_month ? Number(k.birth_month) : null,
                birth_year: k.birth_year ? Number(k.birth_year) : null,
              }))
          : [],
    };
  }

  return (
    <div>
      <StepHeading
        title="Are you currently working with or caring for children?"
        subtitle="This helps us match you with relevant playdates, events, and other caregivers. No last names. No exact birthdates."
      />
      <SingleSelect options={YESNO} value={working} onChange={setWorking} />

      {working === "yes" && (
        <>
          <h3 className="mt-6 mb-3 font-display font-semibold text-ink">Which describes your current setting best?</h3>
          <SingleSelect options={PATTERN} value={pattern} onChange={setPattern} />

          {pattern === "one_or_few" && (
            <div className="mt-6">
              <h3 className="mb-3 font-display font-semibold text-ink">About the child(ren) you work with</h3>
              <div className="space-y-4">
                {kids.map((child, i) => (
                  <div key={i} className="rounded-xl border border-ink/10 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-ink">{i === 0 ? "Child" : `Child (${i + 1})`}</span>
                      {kids.length > 1 && (
                        <button type="button" onClick={() => setKids((k) => k.filter((_, idx) => idx !== i))} aria-label="Remove" className="text-ink-soft hover:text-red-600">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field label="Pet name / nickname">
                        <input className={inputClass} value={child.pet_name} onChange={(e) => updateKid(i, { pet_name: e.target.value })} />
                      </Field>
                      <Field label="Birth month">
                        <select className={inputClass} value={child.birth_month} onChange={(e) => updateKid(i, { birth_month: e.target.value })}>
                          <option value="">Month</option>
                          {MONTHS.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
                        </select>
                      </Field>
                      <Field label="Birth year">
                        <select className={inputClass} value={child.birth_year} onChange={(e) => updateKid(i, { birth_year: e.target.value })}>
                          <option value="">Year</option>
                          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setKids((k) => [...k, emptyChild()])} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover">
                <Plus className="h-4 w-4" /> Add another child
              </button>
            </div>
          )}

          {pattern === "groups" && (
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="mb-3 font-display font-semibold text-ink">Setting</h3>
                <SingleSelect options={SETTING} value={setting} onChange={setSetting} />
              </div>
              <div>
                <h3 className="mb-3 font-display font-semibold text-ink">Ages you work with most</h3>
                <MultiSelect options={AGES} value={ages} onChange={setAges} />
              </div>
              <div>
                <h3 className="mb-3 font-display font-semibold text-ink">Typical group size</h3>
                <SingleSelect options={SIZE} value={size} onChange={setSize} />
              </div>
            </div>
          )}

          {pattern === "varies" && (
            <div className="mt-6">
              <h3 className="mb-3 font-display font-semibold text-ink">Which ages do you work with most often?</h3>
              <MultiSelect options={AGES} value={ages} onChange={setAges} />
            </div>
          )}
        </>
      )}

      <Small>We ask month and year to match age-appropriate activities while protecting children&rsquo;s privacy.</Small>
      <ErrorText>{error}</ErrorText>
      <StepNav onContinue={() => advance(data())} pending={pending} disabled={working === null} onSaveLater={() => saveLater(data())} />
    </div>
  );
}
