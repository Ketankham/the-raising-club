const STEPS = [
  {
    n: "01",
    title: "Join the Club",
    color: "bg-purple/25",
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
    n: "02",
    title: "Find Your Match",
    color: "bg-olive/25",
    body: "Our matching system connects families, caregivers, and programs by location, schedule, age, languages, and values—and for nanny shares, we pair children with similar ages and routines so days run smoothly.",
  },
  {
    n: "03",
    title: "Grow Together",
    color: "bg-yellow/30",
    body: "Caregivers build skills and badges through TRC training, programs upskill their teams, and families access guidance—so every adult around each child keeps growing with evidence-based care.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-cream py-20 lg:py-28">
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
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="rounded-3xl border border-black/5 bg-white p-8 shadow-sm"
            >
              <span
                className={`inline-grid h-14 w-14 place-items-center rounded-2xl ${step.color} font-display text-xl font-extrabold text-ink`}
              >
                {step.n}
              </span>
              <h3 className="mt-6 font-display text-2xl font-bold text-ink">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
