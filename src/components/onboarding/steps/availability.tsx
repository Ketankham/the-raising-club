"use client";

import { useState } from "react";
import { StepHeading, StepNav, MultiSelect, Small, ErrorText, useAdvance, useSaveLater, type Option } from "./ui";
import type { OnboardingState } from "@/lib/onboarding/state";

const TYPES: Option[] = [
  { value: "full_time", label: "Full-time roles" },
  { value: "part_time", label: "Part-time roles" },
  { value: "occasional_backup", label: "Occasional or backup care" },
  { value: "flexible", label: "Flexible / open to different schedules" },
];

const WINDOWS: Option[] = [
  { value: "mornings", label: "Mornings" },
  { value: "afternoons", label: "Afternoons" },
  { value: "evenings", label: "Evenings" },
  { value: "occasional_overnight", label: "Occasional overnights" },
  { value: "routine_overnight", label: "Routine overnights" },
  { value: "weekends", label: "Weekends" },
  { value: "flexible", label: "Flexible / variable schedule" },
];

const OPENNESS: Option[] = [
  { value: "travel_us", label: "Open to traveling with a family within the U.S." },
  { value: "travel_intl", label: "Open to traveling with a family internationally" },
  { value: "multiple_locations", label: "Open to working across multiple family locations" },
  { value: "short_term", label: "Open to short-term roles" },
  { value: "long_term", label: "Open to long-term roles" },
];

export function AvailabilityStep({ state }: { state: OnboardingState }) {
  const { advance, pending, error } = useAdvance("availability");
  const saveLater = useSaveLater();
  const [types, setTypes] = useState<string[]>((state.answers.availabilityTypes as string[]) ?? []);
  const [windows, setWindows] = useState<string[]>((state.answers.availabilityWindows as string[]) ?? []);
  const [openness, setOpenness] = useState<string[]>((state.answers.availabilityOpenness as string[]) ?? []);

  const data = () => ({ availabilityTypes: types, availabilityWindows: windows, availabilityOpenness: openness });

  return (
    <div>
      <StepHeading title="Your availability" subtitle="This helps families and programs understand when you're typically open to work. You can update this anytime." />

      <h3 className="mb-3 font-display font-semibold text-ink">Availability type</h3>
      <MultiSelect options={TYPES} value={types} onChange={setTypes} />

      <h3 className="mt-6 mb-3 font-display font-semibold text-ink">Typical availability</h3>
      <MultiSelect options={WINDOWS} value={windows} onChange={setWindows} />

      <h3 className="mt-6 mb-3 font-display font-semibold text-ink">Additional openness (optional)</h3>
      <MultiSelect options={OPENNESS} value={openness} onChange={setOpenness} />

      <Small>Exact schedules and hours can always be discussed later.</Small>
      <ErrorText>{error}</ErrorText>
      <StepNav onContinue={() => advance(data())} pending={pending} onSaveLater={() => saveLater(data())} />
    </div>
  );
}
