"use client";

import { StepHeading, ErrorText, useAdvance } from "./ui";
import type { OnboardingState } from "@/lib/onboarding/state";

const CONTENT: Record<
  string,
  { title: string; body: string; whatNext: string[]; primary: string }
> = {
  complete: {
    // parent + organization share the `complete` slug; tailored below by role.
    title: "You're in!",
    body: "Here's how to get started.",
    whatNext: [],
    primary: "Start Exploring",
  },
  "complete-job": {
    title: "Your profile is ready",
    body: "You've set up the essentials of your caregiver profile. Families and programs can now learn about your experience, availability, and care preferences.",
    whatNext: [
      "Start exploring opportunities right away",
      "Optionally invite a review to strengthen your profile",
      "Complete identity verification or a background check (optional)",
    ],
    primary: "Go to my profile",
  },
  "complete-community": {
    title: "You're in. Your Raising Club profile is ready.",
    body: "However you're connected to children — today or someday — there's a place for you here.",
    whatNext: [
      "Connect with other caregivers (community, playdates, meetups)",
      "Browse events and classes by age range, setting, and location",
      "Learn through short trainings designed for real caregiving life",
      "Update your experience anytime — especially when you're ready to job search",
    ],
    primary: "Go to Home",
  },
};

const PARENT_NEXT = [
  "Looking for care → Go to Connect to explore caregivers and nearby families",
  "Looking for activities → Visit Events for playdates and gatherings near you",
  "Looking to learn → Browse Learn for practical courses on child development",
];
const ORG_NEXT = [
  "Post roles or browse caregivers",
  "Assign training to your team",
  "Explore tools to support coverage and consistency",
];

export function CompletionStep({ slug, state }: { slug: string; state: OnboardingState }) {
  const { advance, pending, error } = useAdvance(slug);
  const base = CONTENT[slug] ?? CONTENT.complete;

  let title = base.title;
  let body = base.body;
  let whatNext = base.whatNext;
  let primary = base.primary;

  if (slug === "complete" && state.role === "parent") {
    title = "You're in! Now, let's find what you need";
    body = "Here's how families usually get started.";
    whatNext = PARENT_NEXT;
    primary = "Start Exploring";
  } else if (slug === "complete" && state.role === "organization") {
    title = "Your program profile is ready";
    body = "You can now start staffing, training, or growing your program — at your own pace.";
    whatNext = ORG_NEXT;
    primary = "Go to my dashboard";
  }

  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-olive/30 text-2xl">🎉</div>
      <StepHeading title={title} subtitle={body} />
      {whatNext.length > 0 && (
        <ul className="mx-auto mb-6 max-w-md space-y-2 text-left">
          {whatNext.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-ink-soft">
              <span className="text-primary">•</span>
              {item}
            </li>
          ))}
        </ul>
      )}
      <ErrorText>{error}</ErrorText>
      <button
        type="button"
        onClick={() => advance()}
        disabled={pending}
        className="rounded-full bg-yellow px-9 py-3 font-display font-semibold text-ink shadow-sm transition hover:brightness-95 disabled:opacity-50"
      >
        {pending ? "Finishing…" : primary}
      </button>
    </div>
  );
}
