import { BookOpen, HeartHandshake, KeyRound } from "lucide-react";

const VALUES = [
  {
    Icon: BookOpen,
    color: "bg-purple/30",
    title: "Evidence Based",
    body: "Every recommendation is grounded in child development science.",
  },
  {
    Icon: HeartHandshake,
    color: "bg-olive/30",
    title: "Community First",
    body: "We rebuild the village—connecting families, caregivers, and programs around each child.",
  },
  {
    Icon: KeyRound,
    color: "bg-primary-soft/35",
    title: "Built for Access",
    body: "We design for opportunity, so quality care isn’t limited by who can afford it.",
  },
];

export function Values() {
  return (
    <section className="bg-cream py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <h2 className="mx-auto max-w-3xl text-center font-display text-3xl font-extrabold text-ink sm:text-4xl lg:text-5xl">
          Built on values that put children first
        </h2>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {VALUES.map(({ Icon, color, title, body }) => (
            <div
              key={title}
              className="rounded-3xl border border-black/5 bg-white p-8 text-center shadow-sm"
            >
              <span className={`mx-auto inline-grid h-14 w-14 place-items-center rounded-2xl ${color}`}>
                <Icon size={24} className="text-ink" />
              </span>
              <h3 className="mt-5 font-display text-xl font-bold text-ink">
                {title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink/70">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
