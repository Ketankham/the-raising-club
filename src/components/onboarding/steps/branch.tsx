"use client";

import { useState } from "react";
import { StepHeading, StepNav, MultiSelect, Small, ErrorText, useAdvance, type Option } from "./ui";
import type { OnboardingState } from "@/lib/onboarding/state";
import type { CaregiverIntent } from "@/lib/onboarding/flow";

// Values match the `caregiver_intent` enum. `paid_work` drives the job track.
const OPTIONS: Option[] = [
  { value: "paid_work", label: "I'm looking for paid care work with families or programs" },
  { value: "connect", label: "I want to connect with other caregivers (community, playdates, events)" },
  { value: "attend_events", label: "I want to attend events or classes" },
  { value: "learn_grow", label: "I want to learn and grow as a caregiver or educator" },
];

export function BranchStep({ state }: { state: OnboardingState }) {
  const { advance, pending, error } = useAdvance("branch");
  const [value, setValue] = useState<string[]>(
    (state.answers.caregiverIntents as string[] | undefined) ?? [],
  );

  return (
    <div>
      <StepHeading
        title="What brings you here right now?"
        subtitle="What would you like to do on The Raising Club today? Select all that apply — you can change this anytime."
      />
      <MultiSelect options={OPTIONS} value={value} onChange={setValue} />
      <Small>We&rsquo;ll tailor your setup based on what you&rsquo;re interested in right now.</Small>
      <ErrorText>{error}</ErrorText>
      <StepNav
        onContinue={() => advance({ caregiverIntents: value as CaregiverIntent[] })}
        pending={pending}
        disabled={value.length === 0}
      />
    </div>
  );
}
