const STEPS = [
  {
    kicker: "Join",
    title: "the Club",
    card: "bg-purple/30",
    badge: "bg-purple/60",
    body: (
      <>
        <strong className="font-semibold text-ink">Parents:</strong> share your
        children&rsquo;s ages, schedule, budget, and what matters most at home.{" "}
        <strong className="font-semibold text-ink">Caregivers:</strong> highlight
        your skills, experience, training, languages, and specialties.{" "}
        <strong className="font-semibold text-ink">Programs:</strong> add your
        open roles, age groups, and staffing needs.
      </>
    ),
  },
  {
    kicker: "Find",
    title: "Your Match",
    card: "bg-olive/30",
    badge: "bg-olive/60",
    body: "Our matching system connects families, caregivers, and programs by location, schedule, age, languages, and values—and for nanny shares, we pair children with similar ages and routines so days run smoothly.",
  },
  {
    kicker: "Grow",
    title: "Together",
    card: "bg-primary-soft/35",
    badge: "bg-primary-soft/70",
    body: "Caregivers build skills and badges through TRC training, programs upskill their teams, and families access guidance—so every adult around each child keeps growing with evidence-based care.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-lavender/50 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-extrabold text-ink sm:text-4xl lg:text-5xl">
            How It Works
          </h2>
          <p className="mt-5 text-lg text-ink/75">
            Getting started with{" "}
            <strong className="font-semibold text-ink">The Raising Club</strong>{" "}
            is simple. In three steps, families, caregivers, and programs connect
            inside one club for trusted care, real careers, and better-staffed
            programs.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.kicker} className={`rounded-3xl ${step.card} p-8`}>
              <span
                className={`inline-grid h-12 w-12 place-items-center rounded-2xl ${step.badge} font-display text-lg font-extrabold text-ink`}
              >
                {i + 1}
              </span>
              <h3 className="mt-6 text-2xl leading-tight text-ink">
                <span className="block font-display font-bold">{step.kicker}</span>
                <span className="block font-serif italic font-medium">
                  {step.title}
                </span>
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/75">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
