"use client";

import { useState } from "react";
import { StepHeading, StepNav, MultiSelect, SingleSelect, Field, Small, ErrorText, inputClass, useAdvance, useSaveLater, type Option } from "./ui";
import type { OnboardingState } from "@/lib/onboarding/state";

const LEVELS: Option[] = [
  { value: "just_starting", label: "Just getting started" },
  { value: "lt_1_year", label: "Less than 1 year" },
  { value: "1_3_years", label: "1–3 years" },
  { value: "3_5_years", label: "3–5 years" },
  { value: "5_10_years", label: "5–10 years" },
  { value: "10_plus_years", label: "10+ years" },
];

const TYPES: Option[] = [
  { value: "own_family", label: "Caring for children in my own family" },
  { value: "babysitting", label: "Babysitting for families", description: "Occasional or short-term care" },
  { value: "nannying", label: "Nannying for families", description: "Ongoing care with regular responsibilities and routines" },
  { value: "daycare_preschool", label: "Working in a daycare or preschool" },
  { value: "afterschool_enrichment", label: "Working in after-school or enrichment programs" },
  { value: "teaching_tutoring", label: "Teaching, tutoring, or supporting learning" },
  { value: "other", label: "Other caregiving or child-related work" },
];

const EDU = [
  ["", "Select one (optional)"],
  ["high_school", "High school"],
  ["some_college", "Some college"],
  ["associate", "Associate degree"],
  ["bachelor", "Bachelor's degree"],
  ["graduate", "Graduate degree"],
  ["prefer_not_to_say", "Prefer not to say"],
];

export function ExperienceStep({ state }: { state: OnboardingState }) {
  const { advance, pending, error } = useAdvance("experience");
  const saveLater = useSaveLater();
  const [level, setLevel] = useState<string | null>((state.answers.experienceLevel as string) ?? null);
  const [types, setTypes] = useState<string[]>((state.answers.experienceTypes as string[]) ?? []);
  const [languages, setLanguages] = useState<string>(((state.answers.languages as string[]) ?? ["English"]).join(", "));
  const [education, setEducation] = useState<string>((state.answers.educationLevel as string) ?? "");
  const [certs, setCerts] = useState<string>(((state.answers.certifications as string[]) ?? []).join("\n"));

  const data = () => ({
    experienceLevel: level,
    experienceTypes: types,
    languages: languages.split(",").map((s) => s.trim()).filter(Boolean),
    educationLevel: education || null,
    certifications: certs.split("\n").map((s) => s.trim()).filter(Boolean),
  });

  return (
    <div>
      <StepHeading title="Tell us about your experience with children" subtitle="This helps families and programs understand your background. You can update this anytime." />

      <h3 className="mb-3 font-display font-semibold text-ink">About how long have you been caring for children?</h3>
      <SingleSelect options={LEVELS} value={level} onChange={setLevel} />

      <h3 className="mt-6 mb-3 font-display font-semibold text-ink">How have you cared for children?</h3>
      <MultiSelect options={TYPES} value={types} onChange={setTypes} />

      <div className="mt-6 grid gap-4">
        <Field label="Languages you're comfortable using with children" hint="Comma separated. You can remove English and add any other languages.">
          <input className={inputClass} value={languages} onChange={(e) => setLanguages(e.target.value)} />
        </Field>
        <Field label="Education (optional)">
          <select className={inputClass} value={education} onChange={(e) => setEducation(e.target.value)}>
            {EDU.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="Training or certifications (optional)" hint="One per line. Examples: CPR, early childhood courses, workshops, or TRC training.">
          <textarea className={`${inputClass} min-h-24`} value={certs} onChange={(e) => setCerts(e.target.value)} />
        </Field>
      </div>

      <Small>Only include what feels relevant.</Small>
      <ErrorText>{error}</ErrorText>
      <StepNav onContinue={() => advance(data())} pending={pending} onSaveLater={() => saveLater(data())} />
    </div>
  );
}
