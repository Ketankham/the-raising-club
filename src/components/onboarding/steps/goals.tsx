"use client";

import { useState } from "react";
import { StepHeading, StepNav, MultiSelect, Small, ErrorText, useAdvance, type Option } from "./ui";
import type { OnboardingState } from "@/lib/onboarding/state";

const PARENT: Option[] = [
  { value: "find_care", label: "I'm looking for care for my child" },
  { value: "connect_families", label: "I want to connect with other families nearby" },
  { value: "events", label: "I want to join or host events and activities" },
  { value: "learn", label: "I want to learn more about child development and everyday routines" },
  { value: "guidance_team", label: "I already have childcare in place and want guidance for our family and care team" },
];

const ORG: Option[] = [
  { value: "manage_staff", label: "Find and manage staff", description: "Ongoing roles, part-time positions, or substitute coverage" },
  { value: "standardize_training", label: "Standardize training and professional development", description: "Assign courses, track completion, and verify badges" },
  { value: "increase_visibility", label: "Increase visibility to caregivers and families", description: "Be discoverable by people looking for aligned programs" },
  { value: "family_workshops", label: "Offer workshops or learning experiences for enrolled families", description: "Parent education, orientations, and community learning" },
  { value: "event_registration", label: "Create event registration pages for special program events", description: "Manage RSVPs for open houses, performances, or special days" },
];

export function GoalsStep({ state }: { state: OnboardingState }) {
  const isOrg = state.role === "organization";
  const { advance, pending, error } = useAdvance("goals");
  const key = isOrg ? "orgIntents" : "parentIntents";
  const [value, setValue] = useState<string[]>((state.answers[key] as string[] | undefined) ?? []);

  return (
    <div>
      <StepHeading
        title={isOrg ? "What are you looking to do right now?" : "What brings you here right now?"}
        subtitle="Select all that apply. You can change this anytime."
      />
      <MultiSelect options={isOrg ? ORG : PARENT} value={value} onChange={setValue} />
      <Small>We&rsquo;ll tailor what you see based on what feels most relevant right now.</Small>
      <ErrorText>{error}</ErrorText>
      <StepNav
        onContinue={() => advance({ [key]: value })}
        continueLabel={isOrg ? "Finish Setup" : "Continue"}
        pending={pending}
        disabled={value.length === 0}
      />
    </div>
  );
}
