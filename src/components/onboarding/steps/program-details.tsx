"use client";

import { useState } from "react";
import { StepHeading, StepNav, MultiSelect, SingleSelect, Small, ErrorText, useAdvance, useSaveLater, type Option } from "./ui";
import type { OnboardingState } from "@/lib/onboarding/state";

const TYPES: Option[] = [
  { value: "daycare", label: "Daycare / Childcare center" },
  { value: "preschool", label: "Preschool" },
  { value: "afterschool", label: "After-school program" },
  { value: "weekend_enrichment", label: "Weekend or enrichment program" },
  { value: "learning_pod", label: "Learning pod or microschool" },
  { value: "other", label: "Other" },
];

const AGES: Option[] = [
  { value: "infant", label: "Infants (0–12 months)" },
  { value: "toddler", label: "Toddlers (1–3 years)" },
  { value: "preschool", label: "Preschool-age children (3–5 years)" },
  { value: "school_age", label: "School-age children (5–10 years)" },
  { value: "preteen", label: "Preteen / Middle school (11+)" },
];

const SIZE: Option[] = [
  { value: "1_5", label: "1–5 staff" },
  { value: "6_10", label: "6–10 staff" },
  { value: "11_25", label: "11–25 staff" },
  { value: "26_plus", label: "26+ staff" },
];

const LOCATIONS: Option[] = [
  { value: "single", label: "Single location" },
  { value: "multi", label: "Multiple locations" },
];

export function ProgramDetailsStep({ state }: { state: OnboardingState }) {
  const { advance, pending, error } = useAdvance("program-details");
  const saveLater = useSaveLater();
  const [types, setTypes] = useState<string[]>((state.answers.programTypes as string[]) ?? []);
  const [ages, setAges] = useState<string[]>((state.answers.agesServed as string[]) ?? []);
  const [size, setSize] = useState<string | null>((state.answers.programSize as string) ?? null);
  const [loc, setLoc] = useState<string | null>(
    state.answers.multiLocation === undefined ? null : state.answers.multiLocation ? "multi" : "single",
  );

  const data = () => ({ programTypes: types, agesServed: ages, programSize: size, multiLocation: loc === "multi" });

  return (
    <div>
      <StepHeading title="Tell us about your program" subtitle="This helps us tailor staffing, training, and visibility for your organization." />

      <h3 className="mb-3 font-display font-semibold text-ink">Program type</h3>
      <MultiSelect options={TYPES} value={types} onChange={setTypes} />

      <h3 className="mt-6 mb-3 font-display font-semibold text-ink">Ages you serve</h3>
      <MultiSelect options={AGES} value={ages} onChange={setAges} />

      <h3 className="mt-6 mb-3 font-display font-semibold text-ink">Program size</h3>
      <SingleSelect options={SIZE} value={size} onChange={setSize} />

      <h3 className="mt-6 mb-3 font-display font-semibold text-ink">Locations</h3>
      <SingleSelect options={LOCATIONS} value={loc} onChange={setLoc} />

      <Small>You can add or update locations later.</Small>
      <ErrorText>{error}</ErrorText>
      <StepNav onContinue={() => advance(data())} pending={pending} onSaveLater={() => saveLater(data())} />
    </div>
  );
}
