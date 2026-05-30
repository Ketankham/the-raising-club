/**
 * Onboarding flow — single source of truth for steps, branching, progress and resume.
 *
 * Why this file exists: the live Bubble site keeps `?step=1` on every screen, has
 * no progress indicator, and inconsistent "Step X of N" copy. Here the step order,
 * branching and the progress denominator are computed from one definition so the URL,
 * the progress bar and resume logic can never drift apart.
 *
 * Bump FLOW_VERSION whenever the shape changes; `onboarding_progress.flow_version`
 * is stored per user so we can migrate or safely re-route in-flight drafts.
 */

export const FLOW_VERSION = 1;

export type Role = "parent" | "caregiver" | "organization" | "admin";

export type CaregiverIntent =
  | "paid_work"
  | "connect"
  | "attend_events"
  | "learn_grow";

/** Everything known so far in the wizard — drives branching. */
export interface FlowContext {
  role: Exclude<Role, "admin">; // admins never onboard
  caregiverIntents?: CaregiverIntent[];
}

export interface StepDef {
  /** URL slug — `/onboarding/[slug]`. Matches onboarding_progress.current_step. */
  slug: string;
  /** Short title for the header / progress label. */
  title: string;
  /** Only included in the flow when this returns true (branching). */
  includeWhen?: (ctx: FlowContext) => boolean;
  /** The step where the anonymous user converts to a permanent account. */
  isAccountStep?: boolean;
  /** Everything from this step on requires a permanent (non-anon) account. */
  requiresAccount?: boolean;
  /** Terminal completion screen. */
  isComplete?: boolean;
  /** Offer the "Save & Continue Later" secondary action. */
  allowSaveForLater?: boolean;
}

// ---------------------------------------------------------------------------
// Shared entry (anonymous)
// ---------------------------------------------------------------------------
const ROLE_SELECT: StepDef = { slug: "role-select", title: "Welcome" };
const WAYS_TO_USE: StepDef = { slug: "ways-to-use", title: "Ways to use The Raising Club" };

// ---------------------------------------------------------------------------
// Per-role step definitions
// ---------------------------------------------------------------------------
const PARENT_STEPS: StepDef[] = [
  ROLE_SELECT,
  WAYS_TO_USE,
  { slug: "profile", title: "Set up your profile", isAccountStep: true },
  { slug: "goals", title: "What brings you here", requiresAccount: true },
  { slug: "children", title: "Tell us about your child(ren)", requiresAccount: true },
  { slug: "complete", title: "You're in!", requiresAccount: true, isComplete: true },
];

const ORGANIZATION_STEPS: StepDef[] = [
  ROLE_SELECT,
  WAYS_TO_USE,
  { slug: "profile", title: "Set up your profile", isAccountStep: true },
  {
    slug: "program-details",
    title: "Tell us about your program",
    requiresAccount: true,
    allowSaveForLater: true,
  },
  { slug: "goals", title: "What are you looking to do", requiresAccount: true },
  { slug: "complete", title: "You're set up", requiresAccount: true, isComplete: true },
];

const wantsPaidWork = (ctx: FlowContext) =>
  (ctx.caregiverIntents ?? []).includes("paid_work");

const CAREGIVER_STEPS: StepDef[] = [
  ROLE_SELECT,
  WAYS_TO_USE,
  // Branch BEFORE account creation (matches the live flow).
  { slug: "branch", title: "What brings you here" },
  { slug: "profile", title: "Set up your profile", isAccountStep: true },

  // --- Job track (only when paid_work is selected) ---
  {
    slug: "care-prefs",
    title: "Who do you feel comfortable caring for?",
    requiresAccount: true,
    includeWhen: wantsPaidWork,
    allowSaveForLater: true,
  },
  {
    slug: "experience",
    title: "Your experience with children",
    requiresAccount: true,
    includeWhen: wantsPaidWork,
    allowSaveForLater: true,
  },
  {
    slug: "availability",
    title: "Your availability",
    requiresAccount: true,
    includeWhen: wantsPaidWork,
    allowSaveForLater: true,
  },
  {
    slug: "complete-job",
    title: "Your profile is ready",
    requiresAccount: true,
    includeWhen: wantsPaidWork,
    isComplete: true,
  },

  // --- Light / community track (only when paid_work is NOT selected) ---
  {
    slug: "community-context",
    title: "How you work with children",
    requiresAccount: true,
    includeWhen: (ctx) => !wantsPaidWork(ctx),
    allowSaveForLater: true,
  },
  {
    slug: "complete-community",
    title: "You're in",
    requiresAccount: true,
    includeWhen: (ctx) => !wantsPaidWork(ctx),
    isComplete: true,
  },
];

const STEPS_BY_ROLE: Record<Exclude<Role, "admin">, StepDef[]> = {
  parent: PARENT_STEPS,
  caregiver: CAREGIVER_STEPS,
  organization: ORGANIZATION_STEPS,
};

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/** Ordered list of steps that actually apply, given the collected context. */
export function getSteps(ctx: FlowContext): StepDef[] {
  return STEPS_BY_ROLE[ctx.role].filter((s) => !s.includeWhen || s.includeWhen(ctx));
}

export function getStep(ctx: FlowContext, slug: string): StepDef | undefined {
  return getSteps(ctx).find((s) => s.slug === slug);
}

/** 1-based position + total, for "Step X of N" and the progress bar. */
export function getProgress(ctx: FlowContext, slug: string): { index: number; total: number; percent: number } {
  const steps = getSteps(ctx);
  const i = steps.findIndex((s) => s.slug === slug);
  const total = steps.length;
  const index = i < 0 ? 0 : i + 1;
  return { index, total, percent: Math.round((index / total) * 100) };
}

export function getNextStep(ctx: FlowContext, slug: string): StepDef | undefined {
  const steps = getSteps(ctx);
  const i = steps.findIndex((s) => s.slug === slug);
  return i >= 0 ? steps[i + 1] : undefined;
}

export function getPrevStep(ctx: FlowContext, slug: string): StepDef | undefined {
  const steps = getSteps(ctx);
  const i = steps.findIndex((s) => s.slug === slug);
  return i > 0 ? steps[i - 1] : undefined;
}

export function isFinalStep(ctx: FlowContext, slug: string): boolean {
  return !!getStep(ctx, slug)?.isComplete;
}

/**
 * Where should a returning user land? Handles:
 *  - completed flows  -> null (route to dashboard/profile instead)
 *  - unknown / stale slug after a flow change -> first incomplete known step
 *  - branch changes (e.g. caregiver toggled paid_work) -> recompute from completed[]
 */
export function resolveResumeStep(
  ctx: FlowContext,
  saved: { currentStep: string | null; completedSteps: string[]; status: string },
): string | null {
  if (saved.status === "completed") return null;

  const steps = getSteps(ctx);

  // If the saved current step still exists in the (possibly re-branched) flow, use it.
  if (saved.currentStep && steps.some((s) => s.slug === saved.currentStep)) {
    return saved.currentStep;
  }

  // Otherwise jump to the first step the user hasn't completed yet.
  const firstIncomplete = steps.find((s) => !saved.completedSteps.includes(s.slug));
  return (firstIncomplete ?? steps[0]).slug;
}

/** Guard helper: a permanent account is required from the profile step onward. */
export function stepRequiresAccount(ctx: FlowContext, slug: string): boolean {
  const step = getStep(ctx, slug);
  return !!(step?.requiresAccount || step?.isAccountStep);
}
