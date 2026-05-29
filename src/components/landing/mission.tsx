const PILLARS = [
  {
    title: "Raising Children",
    color: "bg-purple/25",
    body: "Children need more than supervision; they need emotionally steady, well-prepared adults who build deep self-trust and competence—so they can grow into their fullest selves.",
  },
  {
    title: "Raising Families",
    color: "bg-olive/25",
    body: "Families deserve an upgrade to their whole ecosystem—where quality care and real understanding of children are the norm, not the exception—so raising children feels shared, not lonely.",
  },
  {
    title: "Raising Caregivers",
    color: "bg-yellow/30",
    body: "Nannies, professional caregivers, and educators deserve respect, training, and real careers—so they can build stable, dignified lives.",
  },
  {
    title: "Raising Society",
    color: "bg-pink",
    body: "Care for children must be treated as essential infrastructure—so work and opportunity aren’t limited by who can afford care, and the next generation grows up ready to lead.",
  },
];

export function Mission() {
  return (
    <>
      {/* Quote band */}
      <section className="bg-sage">
        <div className="mx-auto max-w-5xl px-5 py-16 text-center lg:px-8 lg:py-20">
          <p className="font-display text-3xl font-extrabold leading-snug text-ink sm:text-4xl lg:text-[2.75rem]">
            &ldquo;When families rise,{" "}
            <span className="text-primary">society rises.</span>&rdquo;
          </p>
        </div>
      </section>

      {/* Why The Raising Club */}
      <section className="bg-cream py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-primary">
              Our Mission
            </p>
            <h2 className="mt-4 font-display text-3xl font-extrabold text-ink sm:text-4xl lg:text-5xl">
              Why The Raising Club
            </h2>
            <p className="mt-5 text-lg text-ink/75">
              Because raising a child isn&rsquo;t the job of one parent or one
              caregiver—it takes families, caregivers, and programs working
              together inside one club.
            </p>
            <p className="mt-6 font-display text-base font-semibold text-ink">
              At The Raising Club, we are:
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p) => (
              <div
                key={p.title}
                className={`rounded-3xl ${p.color} p-7`}
              >
                <h3 className="font-display text-xl font-extrabold text-ink">
                  {p.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/75">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
