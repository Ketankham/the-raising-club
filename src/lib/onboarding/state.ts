/**
 * Onboarding state types + helpers shared between server actions and UI.
 * Keep framework-agnostic (no "use server" here).
 */
import {
  type FlowContext,
  type Role,
  type CaregiverIntent,
} from "./flow";

export type OnboardingRole = Exclude<Role, "admin">;

/** A row from `onboarding_progress` plus the derived role from `profiles`. */
export interface OnboardingState {
  userId: string;
  isAnonymous: boolean;
  role: OnboardingRole | null;
  flowVersion: number;
  currentStep: string | null;
  completedSteps: string[];
  status: "in_progress" | "completed" | "abandoned";
  /** Staging area for answers not yet promoted to typed tables. */
  answers: OnboardingAnswers;
  onboardingCompletedAt: string | null;
  /** Current `profiles` fields, so steps can prefill when revisited. */
  profileDetails: {
    firstName: string | null;
    lastName: string | null;
    preferredName: string | null;
    phone: string | null;
    zipCode: string | null;
    email: string | null;
    registeredAt: string | null;
  };
}

/** Loosely-typed staging bag persisted to `onboarding_progress.answers`. */
export interface OnboardingAnswers {
  /** Caregiver branch intents — drive the caregiver flow split. */
  caregiverIntents?: CaregiverIntent[];
  [key: string]: unknown;
}

/** Build the FlowContext needed by flow.ts from the persisted state. */
export function toFlowContext(state: Pick<OnboardingState, "role" | "answers">): FlowContext | null {
  if (!state.role) return null;
  return {
    role: state.role,
    caregiverIntents: state.answers.caregiverIntents,
  };
}
