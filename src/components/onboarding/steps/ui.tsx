"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { completeStep, saveAnswers } from "@/lib/onboarding/actions";
import type { OnboardingAnswers } from "@/lib/onboarding/state";

export type Option = { value: string; label: string; description?: string };

/** Advance the state-machine for a step, persisting answers, then navigate. */
export function useAdvance(slug: string) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function advance(answers?: OnboardingAnswers) {
    setError(null);
    start(async () => {
      const res = await completeStep(slug, answers);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (res.data.completed) router.push("/dashboard");
      else if (res.data.nextStep) router.push(`/onboarding/${res.data.nextStep}`);
    });
  }

  return { advance, pending, error };
}

/** "Save & Continue Later": persist current answers, then exit to home. */
export function useSaveLater() {
  const router = useRouter();
  return (answers: OnboardingAnswers) => {
    void saveAnswers(answers).finally(() => router.push("/"));
  };
}

export function StepHeading({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-2 text-ink-soft">{subtitle}</p>}
    </div>
  );
}

export function Small({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-xs text-ink-soft">{children}</p>;
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="mt-3 text-sm text-red-600">{children}</p>;
}

export function StepNav({
  onContinue,
  continueLabel = "Continue",
  pending,
  disabled,
  onSaveLater,
}: {
  onContinue: () => void;
  continueLabel?: string;
  pending?: boolean;
  disabled?: boolean;
  onSaveLater?: () => void;
  /** @deprecated back now lives in the progress header */
  showBack?: boolean;
}) {
  // Navigation: "Save & Continue Later" (secondary) + Continue (yellow pill),
  // centered. Back lives in the progress header.
  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
      {onSaveLater && (
        <button
          type="button"
          onClick={onSaveLater}
          className="rounded-full bg-ink/5 px-7 py-3 font-display font-semibold text-ink transition hover:bg-ink/10"
        >
          Save &amp; Continue Later
        </button>
      )}
      <button
        type="button"
        onClick={onContinue}
        disabled={disabled || pending}
        className="rounded-full bg-yellow px-9 py-3 font-display font-semibold text-ink shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Saving…" : continueLabel}
      </button>
    </div>
  );
}

function OptionCard({
  option,
  selected,
  onToggle,
  kind,
}: {
  option: Option;
  selected: boolean;
  onToggle: () => void;
  kind: "check" | "radio";
}) {
  return (
    <button
      type="button"
      role={kind === "radio" ? "radio" : "checkbox"}
      aria-checked={selected}
      onClick={onToggle}
      className={`flex w-full items-center gap-3 rounded-2xl border px-5 py-4 text-left transition ${
        selected
          ? "border-yellow bg-yellow/25"
          : "border-ink/12 bg-white hover:border-ink/25"
      }`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center border transition ${
          kind === "radio" ? "rounded-full" : "rounded-md"
        } ${selected ? "border-yellow bg-yellow text-white" : "border-ink/25 bg-white"}`}
      >
        {selected && <Check className="h-4 w-4" strokeWidth={3} aria-hidden />}
      </span>
      <span>
        <span className="block font-medium text-ink">{option.label}</span>
        {option.description && (
          <span className="mt-0.5 block text-sm text-ink-soft">{option.description}</span>
        )}
      </span>
    </button>
  );
}

export function MultiSelect({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(v: string) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }
  return (
    <div className="grid gap-3" role="group">
      {options.map((o) => (
        <OptionCard key={o.value} option={o} selected={value.includes(o.value)} onToggle={() => toggle(o.value)} kind="check" />
      ))}
    </div>
  );
}

export function SingleSelect({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: string | null;
  onChange: (next: string) => void;
}) {
  return (
    <div className="grid gap-3" role="radiogroup">
      {options.map((o) => (
        <OptionCard key={o.value} option={o} selected={value === o.value} onToggle={() => onChange(o.value)} kind="radio" />
      ))}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-full border border-ink/15 bg-white px-5 py-3 text-ink outline-none transition placeholder:text-ink/40 focus:border-primary focus:ring-1 focus:ring-primary";
