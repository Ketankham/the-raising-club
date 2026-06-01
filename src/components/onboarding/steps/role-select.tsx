"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check } from "lucide-react";
import { selectRole } from "@/lib/onboarding/actions";
import type { OnboardingRole, OnboardingState } from "@/lib/onboarding/state";

const ROLES: {
  value: OnboardingRole;
  title: string;
  accent: string;
  note?: string;
  blurb: string;
  image: string;
}[] = [
  {
    value: "parent",
    title: "Parent /",
    accent: "Guardian",
    blurb: "I'm looking for care, education, or community for my child.",
    image: "/images/onboarding/parent.png",
  },
  {
    value: "caregiver",
    title: "Caregiver /",
    accent: "Educator",
    note: "(Individual)",
    blurb: "I provide care and support learning for children and families.",
    image: "/images/onboarding/educator.png",
  },
  {
    value: "organization",
    title: "Program / Organization /",
    accent: "Childcare Provider",
    blurb:
      "We offer care and learning through a daycare, preschool, or after-school program.",
    image: "/images/onboarding/organization.png",
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
        <h1 className="text-3xl text-ink sm:text-4xl">
          <span className="font-serif font-medium">Welcome to</span>{" "}
          <span className="font-display font-bold">The Raising Club</span>
        </h1>
        <p className="mt-3 text-ink-soft">
          To get started, tell us how you&rsquo;re here. This helps us create the
          right experience for you.
        </p>
      </div>

      <fieldset>
        <legend className="mb-5 w-full text-center font-display text-lg font-semibold">
          I&rsquo;m <span className="text-primary">here as a</span>&hellip;
        </legend>
        <div className="grid gap-4 sm:grid-cols-3">
          {ROLES.map(({ value, title, accent, note, blurb, image }) => {
            const isSel = selected === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={isSel}
                onClick={() => setSelected(value)}
                className={`flex flex-col rounded-2xl border bg-white p-3 text-left transition ${
                  isSel
                    ? "border-olive ring-2 ring-olive"
                    : "border-ink/10 hover:border-ink/25"
                }`}
              >
                <div className="relative">
                  <Image
                    src={image}
                    alt=""
                    width={420}
                    height={320}
                    className="aspect-[4/3] w-full rounded-xl object-cover"
                  />
                  {isSel && (
                    <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-olive text-white shadow-sm">
                      <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-base leading-snug text-ink">
                  <span className="font-display font-bold">{title} </span>
                  <span className="font-serif font-medium italic">{accent}</span>
                  {note && (
                    <span className="ml-1 text-xs font-medium text-ink-soft">
                      {note}
                    </span>
                  )}
                </h3>
                <p className="mt-2 text-sm text-ink-soft">{blurb}</p>
              </button>
            );
          })}
        </div>
      </fieldset>

      <p className="mt-5 text-center text-xs text-ink-soft">
        You can change this later if needed. This helps us set up the right
        experience.
      </p>

      {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selected || pending}
          className="rounded-full bg-yellow px-9 py-3 font-display font-semibold text-ink shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Continuing…" : "Continue"}
        </button>
      </div>
    </div>
  );
}
