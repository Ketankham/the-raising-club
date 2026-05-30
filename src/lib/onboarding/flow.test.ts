import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getSteps,
  getProgress,
  getNextStep,
  getPrevStep,
  isFinalStep,
  stepRequiresAccount,
  resolveResumeStep,
  type FlowContext,
} from "./flow.ts";

const slugs = (ctx: FlowContext) => getSteps(ctx).map((s) => s.slug);

const parent: FlowContext = { role: "parent" };
const org: FlowContext = { role: "organization" };
const cgJob: FlowContext = { role: "caregiver", caregiverIntents: ["paid_work", "connect"] };
const cgLight: FlowContext = { role: "caregiver", caregiverIntents: ["connect"] };
const cgNone: FlowContext = { role: "caregiver" }; // no intents -> light track

// ---------------------------------------------------------------------------
// Step composition per role
// ---------------------------------------------------------------------------
test("parent flow has the expected ordered steps", () => {
  assert.deepEqual(slugs(parent), [
    "role-select", "ways-to-use", "profile", "goals", "children", "complete",
  ]);
});

test("organization flow has the expected ordered steps", () => {
  assert.deepEqual(slugs(org), [
    "role-select", "ways-to-use", "profile", "program-details", "goals", "complete",
  ]);
});

test("caregiver JOB track includes job steps, excludes community steps", () => {
  assert.deepEqual(slugs(cgJob), [
    "role-select", "ways-to-use", "branch", "profile",
    "care-prefs", "experience", "availability", "complete-job",
  ]);
});

test("caregiver LIGHT track includes community steps, excludes job steps", () => {
  assert.deepEqual(slugs(cgLight), [
    "role-select", "ways-to-use", "branch", "profile",
    "community-context", "complete-community",
  ]);
});

test("caregiver with NO intents defaults to the light track", () => {
  assert.deepEqual(slugs(cgNone), slugs(cgLight));
});

// ---------------------------------------------------------------------------
// Progress (denominator must reflect the actual branch, not a fixed number)
// ---------------------------------------------------------------------------
test("progress reflects branch-specific totals", () => {
  assert.deepEqual(getProgress(parent, "profile"), { index: 3, total: 6, percent: 50 });
  assert.deepEqual(getProgress(cgJob, "availability"), { index: 7, total: 8, percent: 88 });
  assert.deepEqual(getProgress(cgLight, "community-context"), { index: 5, total: 6, percent: 83 });
});

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
test("next/prev navigate within the branched flow", () => {
  assert.equal(getNextStep(cgJob, "profile")?.slug, "care-prefs");
  assert.equal(getNextStep(cgLight, "profile")?.slug, "community-context");
  assert.equal(getPrevStep(parent, "children")?.slug, "goals");
  assert.equal(getPrevStep(parent, "role-select"), undefined);
  assert.equal(getNextStep(parent, "complete"), undefined); // nothing after final
});

test("isFinalStep identifies completion screens only", () => {
  assert.equal(isFinalStep(parent, "complete"), true);
  assert.equal(isFinalStep(cgJob, "complete-job"), true);
  assert.equal(isFinalStep(cgLight, "complete-community"), true);
  assert.equal(isFinalStep(cgLight, "community-context"), false);
});

// ---------------------------------------------------------------------------
// Account gating
// ---------------------------------------------------------------------------
test("account is required from the profile step onward, not before", () => {
  assert.equal(stepRequiresAccount(parent, "role-select"), false);
  assert.equal(stepRequiresAccount(parent, "ways-to-use"), false);
  assert.equal(stepRequiresAccount(cgJob, "branch"), false); // caregiver branch is pre-account
  assert.equal(stepRequiresAccount(parent, "profile"), true);
  assert.equal(stepRequiresAccount(parent, "goals"), true);
  assert.equal(stepRequiresAccount(cgJob, "care-prefs"), true);
});

// ---------------------------------------------------------------------------
// Resume / edge cases
// ---------------------------------------------------------------------------
test("completed onboarding resumes to null (go to dashboard)", () => {
  assert.equal(
    resolveResumeStep(parent, { currentStep: "complete", completedSteps: [], status: "completed" }),
    null,
  );
});

test("valid saved step resumes exactly there", () => {
  assert.equal(
    resolveResumeStep(parent, { currentStep: "children", completedSteps: ["role-select", "ways-to-use", "profile", "goals"], status: "in_progress" }),
    "children",
  );
});

test("stale/unknown saved step falls back to first incomplete", () => {
  assert.equal(
    resolveResumeStep(parent, { currentStep: "some-removed-step", completedSteps: ["role-select", "ways-to-use"], status: "in_progress" }),
    "profile",
  );
});

test("caregiver who drops paid_work mid-flow re-routes off the dead job step", () => {
  // Was on the job track, reached 'experience', then changed intents to light.
  // 'experience' no longer exists in the light flow -> resume to first incomplete.
  const completed = ["role-select", "ways-to-use", "branch", "profile"];
  const resumed = resolveResumeStep(cgLight, {
    currentStep: "experience",
    completedSteps: completed,
    status: "in_progress",
  });
  assert.equal(resumed, "community-context");
});

test("caregiver who adds paid_work gets the job steps as remaining work", () => {
  // Completed the light path's early steps, then added paid_work.
  const completed = ["role-select", "ways-to-use", "branch", "profile"];
  const resumed = resolveResumeStep(cgJob, {
    currentStep: "community-context", // light step, gone from job flow
    completedSteps: completed,
    status: "in_progress",
  });
  assert.equal(resumed, "care-prefs");
});

test("fresh start with nothing saved resumes to role-select", () => {
  assert.equal(
    resolveResumeStep(parent, { currentStep: null, completedSteps: [], status: "in_progress" }),
    "role-select",
  );
});
