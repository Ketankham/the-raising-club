import type { ReactNode } from "react";
import Link from "next/link";

export function PageWrap({ children }: { children: ReactNode }) {
  return <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>;
}

export function Greeting({ name, sub }: { name: string; sub?: string }) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-3xl font-bold text-ink">Welcome, {name} 👋</h1>
      {sub && <p className="mt-1 text-ink-soft">{sub}</p>}
    </div>
  );
}

/** A clickable lane/pillar card. */
export function LaneCard({
  href,
  emoji,
  title,
  body,
  tone = "cream",
}: {
  href?: string;
  emoji: string;
  title: string;
  body: string;
  tone?: "cream" | "lavender" | "sage" | "mint" | "pink";
}) {
  const toneClass = {
    cream: "bg-cream",
    lavender: "bg-lavender",
    sage: "bg-sage/50",
    mint: "bg-mint",
    pink: "bg-pink",
  }[tone];

  const inner = (
    <div className={`h-full rounded-2xl border border-ink/5 ${toneClass} p-6 transition hover:shadow-sm`}>
      <div className="text-2xl">{emoji}</div>
      <h3 className="mt-3 font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink-soft">{body}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-ink/5 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
