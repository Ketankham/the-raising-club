"use client";

import { useState } from "react";
import { StepHeading, StepNav, MultiSelect, Small, ErrorText, useAdvance, useSaveLater, type Option } from "./ui";
import type { OnboardingState } from "@/lib/onboarding/state";

const AGES: Option[] = [
  { value: "infant", label: "Infants (0–12 months)" },
  { value: "toddler", label: "Toddlers (1–3 years)" },
  { value: "preschool", label: "Preschool-age children (3–5 years)" },
  { value: "school_age", label: "School-age children (5+ years)" },
  { value: "preteen", label: "Middle school-age children (11+ years)" },
];

const SETTINGS: Option[] = [
  { value: "one_child_family", label: "Caring for one child in a family" },
  { value: "multi_children_family", label: "Caring for two or more children in a family" },
  { value: "nanny_share", label: "Caring for two children in a nanny share" },
  { value: "live_in", label: "Live-in care with a family" },
  { value: "tutoring_enrichment", label: "Tutoring or enrichment work (one-on-one or in a learning pod)" },
  { value: "group_center", label: "Group care in centers or programs" },
];

export function CarePrefsStep({ state }: { state: OnboardingState }) {
  const { advance, pending, error } = useAdvance("care-prefs");
  const saveLater = useSaveLater();
  const [ages, setAges] = useState<string[]>((state.answers.ageGroups as string[]) ?? []);
  const [settings, setSettings] = useState<string[]>((state.answers.careSettings as string[]) ?? []);

  const data = () => ({ ageGroups: ages, careSettings: settings });

  return (
    <div>
      <StepHeading title="Who do you feel comfortable caring for?" subtitle="Select what feels familiar. You can update this anytime." />

      <h3 className="mb-3 font-display font-semibold text-ink">Ages &amp; stages</h3>
      <MultiSelect options={AGES} value={ages} onChange={setAges} />

      <h3 className="mt-6 mb-3 font-display font-semibold text-ink">Care settings</h3>
      <MultiSelect options={SETTINGS} value={settings} onChange={setSettings} />

      <Small>This helps families and programs understand what you&rsquo;re comfortable with — not what you&rsquo;re expected to know already.</Small>
      <ErrorText>{error}</ErrorText>
      <StepNav onContinue={() => advance(data())} pending={pending} onSaveLater={() => saveLater(data())} />
    </div>
  );
}
