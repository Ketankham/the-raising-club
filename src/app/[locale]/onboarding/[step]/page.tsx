import { redirect } from "next/navigation";
import { getOnboardingState } from "@/lib/onboarding/actions";
import { toFlowContext } from "@/lib/onboarding/state";
import { getStep, getProgress, stepRequiresAccount } from "@/lib/onboarding/flow";
import { StepProgress } from "@/components/onboarding/progress-bar";
import { renderStep, isKnownStep } from "@/components/onboarding/steps/registry";

/**
 * Renders a single onboarding step. The URL slug is the source of truth for
 * what is shown (so browser Back works); we validate it against the live flow
 * and guard account-gated steps.
 */
export default async function OnboardingStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  const state = await getOnboardingState();

  // No session at all -> go bootstrap one.
  if (!state) redirect("/onboarding");
  if (state.status === "completed") redirect("/dashboard");

  // role-select is always reachable, even before a role is chosen.
  if (step === "role-select") {
    return (
      <div>
        <StepProgress index={1} total={5} />
        {renderStep("role-select", state)}
      </div>
    );
  }

  const ctx = toFlowContext(state);
  if (!ctx) redirect("/onboarding/role-select");

  // Slug must belong to the (possibly branched) flow for this user.
  const stepDef = getStep(ctx, step);
  if (!stepDef || !isKnownStep(step)) {
    // Stale / out-of-branch slug -> let resume re-route them safely.
    redirect("/onboarding/resume");
  }

  // Account-gated steps require the profile step to be done first. We gate on
  // profile completion (not on `is_anonymous`) because with email confirmation
  // ON the user stays anonymous until they confirm — but should still proceed.
  if (stepRequiresAccount(ctx, step) && step !== "profile" && !state.completedSteps.includes("profile")) {
    redirect("/onboarding/profile");
  }

  const { index, total } = getProgress(ctx, step);

  return (
    <div>
      <StepProgress index={index} total={total} />
      {renderStep(step, state)}
    </div>
  );
}
