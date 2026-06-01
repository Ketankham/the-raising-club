import { Blocks, House, Accessibility } from "lucide-react";

const VALUES = [
  {
    Icon: Blocks,
    lead: "Evidence",
    accent: "Based",
    body: "Every recommendation is grounded in child development science.",
  },
  {
    Icon: House,
    lead: "Community",
    accent: "first",
    body: "A real village: parents, caregivers, grandparents, and educators.",
  },
  {
    Icon: Accessibility,
    lead: "Built for",
    accent: "Access",
    body: "Designed for minorities, women, and disabled communities.",
  },
];

export function Values() {
  return (
    <section className="bg-cream py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <h2 className="mx-auto max-w-3xl text-center text-3xl font-extrabold text-ink sm:text-4xl lg:text-5xl">
          <span className="font-display">Built on values that put </span>
          <span className="font-serif font-medium italic">children first</span>
        </h2>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {VALUES.map(({ Icon, lead, accent, body }) => (
            <div
              key={accent}
              className="rounded-3xl border border-black/5 bg-white p-9 text-center shadow-sm"
            >
              <Icon size={34} strokeWidth={1.5} className="mx-auto text-ink" />
              <h3 className="mt-5 text-xl text-ink">
                <span className="font-display font-bold">{lead} </span>
                <span className="font-serif font-medium italic">{accent}</span>
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink/70">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
