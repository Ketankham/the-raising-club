import type { ReactElement } from "react";
import type { OnboardingState } from "@/lib/onboarding/state";
import { RoleSelectStep } from "./role-select";
import { WaysToUseStep } from "./ways-to-use";
import { BranchStep } from "./branch";
import { ProfileStep } from "./profile";
import { GoalsStep } from "./goals";
import { ChildrenStep } from "./children";
import { CarePrefsStep } from "./care-prefs";
import { ExperienceStep } from "./experience";
import { AvailabilityStep } from "./availability";
import { CommunityContextStep } from "./community-context";
import { ProgramDetailsStep } from "./program-details";
import { CompletionStep } from "./completion";

const KNOWN_STEPS = new Set<string>([
  "role-select",
  "ways-to-use",
  "branch",
  "profile",
  "goals",
  "children",
  "care-prefs",
  "experience",
  "availability",
  "community-context",
  "program-details",
  "complete",
  "complete-job",
  "complete-community",
]);

export function isKnownStep(slug: string): boolean {
  return KNOWN_STEPS.has(slug);
}

export function renderStep(slug: string, state: OnboardingState): ReactElement {
  switch (slug) {
    case "role-select":
      return <RoleSelectStep state={state} />;
    case "ways-to-use":
      return <WaysToUseStep state={state} />;
    case "branch":
      return <BranchStep state={state} />;
    case "profile":
      return <ProfileStep state={state} />;
    case "goals":
      return <GoalsStep state={state} />;
    case "children":
      return <ChildrenStep state={state} />;
    case "care-prefs":
      return <CarePrefsStep state={state} />;
    case "experience":
      return <ExperienceStep state={state} />;
    case "availability":
      return <AvailabilityStep state={state} />;
    case "community-context":
      return <CommunityContextStep state={state} />;
    case "program-details":
      return <ProgramDetailsStep state={state} />;
    case "complete":
    case "complete-job":
    case "complete-community":
      return <CompletionStep slug={slug} state={state} />;
    default:
      return <CompletionStep slug="complete" state={state} />;
  }
}
