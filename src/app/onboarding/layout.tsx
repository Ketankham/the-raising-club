import type { ReactNode } from "react";
import { Logo } from "@/components/logo";

/** Onboarding chrome: cream backdrop, top logo, centered white card. */
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <header className="flex items-center justify-center border-b border-ink/5 px-6 py-5">
        <Logo />
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/5 sm:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
