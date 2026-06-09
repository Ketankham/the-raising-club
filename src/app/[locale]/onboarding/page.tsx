import { redirect } from "next/navigation";
import { getOnboardingState } from "@/lib/onboarding/actions";
import { StartOnboarding } from "@/components/onboarding/start-onboarding";

/**
 * Onboarding entry. Routes the visitor to the right place:
 *  - no session yet  -> bootstrap an anonymous session, then go to the first step
 *  - already done     -> dashboard
 *  - mid-flow         -> the saved current step (resume)
 */
export default async function OnboardingEntry() {
  const state = await getOnboardingState();

  if (!state) return <StartOnboarding />;
  if (state.status === "completed") redirect("/dashboard");

  redirect(`/onboarding/${state.currentStep ?? "role-select"}`);
}
