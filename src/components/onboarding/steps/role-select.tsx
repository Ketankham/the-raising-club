"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Baby, HeartHandshake, Building2 } from "lucide-react";
import { selectRole } from "@/lib/onboarding/actions";
import type { OnboardingRole, OnboardingState } from "@/lib/onboarding/state";

const ROLES: {
  value: OnboardingRole;
  title: string;
  blurb: string;
  Icon: typeof Baby;
}[] = [
  {
    value: "parent",
    title: "Parent / Guardian",
    blurb: "I'm looking for care, education, or community for my child.",
    Icon: Baby,
  },
  {
    value: "caregiver",
    title: "Caregiver / Educator",
    blurb: "I provide care and support learning for children and families.",
    Icon: HeartHandshake,
  },
  {
    value: "organization",
    title: "Program / Organization",
    blurb: "We offer care and learning through a daycare, preschool, or after-school program.",
    Icon: Building2,
  },
];

export function RoleSelectStep({ state }: { state: OnboardingState }) {
  const router = useRouter();
  const [selected, setSelected] = useState<OnboardingRole | null>(state.role);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleContinue() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const res = await selectRole(selected);
      if (res.ok) router.push(`/onboarding/${res.data.nextStep}`);
      else setError(res.error);
    });
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold text-ink">
          Welcome to <span className="text-primary">The Raising Club</span>
        </h1>
        <p className="mt-3 text-ink-soft">
          To get started, tell us how you&rsquo;re here. This helps us create the right experience for you.
        </p>
      </div>

      <fieldset>
        <legend className="mb-4 text-center font-display text-lg font-semibold text-ink">
          I&rsquo;m here as a&hellip;
        </legend>
        <div className="grid gap-4 sm:grid-cols-3">
          {ROLES.map(({ value, title, blurb, Icon }) => {
            const isSel = selected === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={isSel}
                onClick={() => setSelected(value)}
                className={`flex flex-col items-start gap-3 rounded-xl border p-5 text-left transition ${
                  isSel
                    ? "border-primary bg-primary/5 ring-2 ring-primary"
                    : "border-ink/10 hover:border-primary/50 hover:bg-cream"
                }`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${
                    isSel ? "bg-primary text-white" : "bg-cream text-primary"
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="font-display font-semibold text-ink">{title}</span>
                <span className="text-sm text-ink-soft">{blurb}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <p className="mt-4 text-center text-xs text-ink-soft">
        You can change this later if needed. This helps us set up the right experience.
      </p>

      {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selected || pending}
          className="rounded-lg bg-primary px-8 py-3 font-display font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Continuing…" : "Continue"}
        </button>
      </div>
    </div>
  );
}
