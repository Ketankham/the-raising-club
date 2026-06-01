"use client";

import { StepNav, Small, ErrorText, useAdvance } from "./ui";
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

// Soft pastel card backgrounds, matching the Figma "ways to use" cards.
const CARD_BG = ["bg-[#faf1e4]", "bg-mint", "bg-sage/60"];

/** Title with "The Raising Club" in bold sans and the rest in serif. */
function MixedTitle({ text }: { text: string }) {
  const brand = "The Raising Club";
  const i = text.indexOf(brand);
  if (i === -1) return <span className="font-display font-bold">{text}</span>;
  return (
    <>
      <span className="font-serif font-medium">{text.slice(0, i)}</span>
      <span className="font-display font-bold">{brand}</span>
      <span className="font-serif font-medium">{text.slice(i + brand.length)}</span>
    </>
  );
}

export function WaysToUseStep({ state }: { state: OnboardingState }) {
  const { advance, pending, error } = useAdvance("ways-to-use");
  const content = CONTENT[(state.role ?? "parent") as keyof typeof CONTENT];

  return (
    <div>
      <h1 className="mb-10 text-center text-3xl leading-tight text-ink sm:text-4xl">
        <MixedTitle text={content.title} />
      </h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {content.cards.map(([title, body], i) => {
          const [icon, ...rest] = title.split(" ");
          const label = rest.join(" ");
          return (
            <div key={title} className={`rounded-2xl p-6 ${CARD_BG[i % CARD_BG.length]}`}>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/70 text-xl">
                {icon}
              </span>
              <h3 className="mt-4 font-serif text-xl font-semibold text-ink">{label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/75">{body}</p>
            </div>
          );
        })}
      </div>
      <Small>You don&rsquo;t need to decide how you&rsquo;ll use it right now. You can start in one place and explore more over time.</Small>
      <ErrorText>{error}</ErrorText>
      <StepNav onContinue={() => advance()} continueLabel="Begin Profile" pending={pending} />
    </div>
  );
}
