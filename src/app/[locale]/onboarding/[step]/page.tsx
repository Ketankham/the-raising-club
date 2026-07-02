import { redirect } from "next/navigation";
import { getOnboardingState } from "@/lib/onboarding/actions";
import { toFlowContext } from "@/lib/onboarding/state";
import { getStep, getPrevStep, getProgress, stepRequiresAccount } from "@/lib/onboarding/flow";
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
        <StepProgress index={1} total={5} prevHref="/" />
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

  // Explicit previous-step target for the back arrow (history is unreliable).
  // Every step is revisitable: the profile step renders an editable summary
  // once the account exists, and answers prefill from the staging bag, so
  // users can move back and forth freely until the flow is promoted.
  const prev = getPrevStep(ctx, step);
  const prevHref = prev ? `/onboarding/${prev.slug}` : null;

  return (
    <div>
      <StepProgress index={index} total={total} prevHref={prevHref} />
      {renderStep(step, state)}
    </div>
  );
}
