"use client";

import { StepHeading, StepNav, Small, ErrorText, useAdvance } from "./ui";
import type { OnboardingState } from "@/lib/onboarding/state";

const CONTENT = {
  parent: {
    title: "Families use The Raising Club in different ways.",
    cards: [
      ["🔗 Connect", "Find your people — and the care that fits your life. Connect with caregivers and educators, meet nearby families, or explore shared care for nanny shares."],
      ["📅 Events", "Experience community — together, in real life. Join or host play-based gatherings, playdates, parent workshops, and children's events."],
      ["📚 Learn", "Feel more confident as your child grows. Learn about child development, routines, and care through practical courses designed for real families."],
    ],
  },
  caregiver: {
    title: "Caregivers and educators use The Raising Club in different ways.",
    cards: [
      ["🔗 Connect", "Build connections in care. Work with families for one-on-one care, nanny shares, tutoring, or learning pods — or connect with other caregivers."],
      ["🌱 Grow", "Elevate your expertise. Strengthen your skills, deepen your understanding of child development, and build a profile that reflects how you care."],
      ["⭐ Lead", "Turn your experience into leadership. Lead nanny shares or learning pods, host events or classes, and shape how care happens in your community."],
    ],
  },
  organization: {
    title: "Programs use The Raising Club to staff, train, and grow with consistency.",
    cards: [
      ["👥 Staff", "Find and maintain reliable, aligned staff. Post roles, connect with trained caregivers, and access a bench of substitutes and floaters."],
      ["📊 Train", "Train your team with shared standards. Assign courses, track completion, and verify badges so everyone is aligned."],
      ["🌱 Grow", "Build stability as your program grows. Increase visibility, support onboarding across sites, and scale training and staffing."],
    ],
  },
} as const;

export function WaysToUseStep({ state }: { state: OnboardingState }) {
  const { advance, pending, error } = useAdvance("ways-to-use");
  const content = CONTENT[(state.role ?? "parent") as keyof typeof CONTENT];

  return (
    <div>
      <StepHeading title={content.title} />
      <div className="grid gap-4 sm:grid-cols-3">
        {content.cards.map(([title, body]) => (
          <div key={title} className="rounded-xl border border-ink/10 bg-cream/60 p-5">
            <h3 className="font-display font-semibold text-ink">{title}</h3>
            <p className="mt-2 text-sm text-ink-soft">{body}</p>
          </div>
        ))}
      </div>
      <Small>You don&rsquo;t need to decide how you&rsquo;ll use it right now. You can start in one place and explore more over time.</Small>
      <ErrorText>{error}</ErrorText>
      <StepNav onContinue={() => advance()} continueLabel="Begin Profile" pending={pending} />
    </div>
  );
}
