import type { ReactNode } from "react";
import { Logo } from "@/components/logo";

/** Onboarding chrome: cream backdrop, top-left logo, content on the cream. */
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <header className="px-6 py-6 sm:px-10">
        <Logo />
      </header>
      <main className="mx-auto w-full max-w-3xl px-5 pb-20 sm:px-8">
        {children}
      </main>
    </div>
  );
}
