const PARAGRAPHS = [
  "The Raising Club is building modern infrastructure for childhood: a membership platform where education, connection, and community live in one experience. Every adult around a child has a place here—parents, caregivers, grandparents, educators, and extended family.",
  "We take the best of child development science—brain development, learning, nutrition, language, and mental health—and turn it into guidance rooted in skills, regulation, and repair. That becomes daily practice: consistent routines, clear boundaries without yelling, environments that prevent chaos, and communication tools that reduce frustration.",
  "We also rebuild the “village” for real life. TRC connects families with screened, trained caregivers and supports care setups that actually work: one-on-one care, nanny shares, pods, playdates, and local networks—made easier with clear agreements, defined roles, and a path that adapts as life changes.",
  "When you raise the standard of care, you change more than childhood. You professionalize caregiving careers, reduce parental anxiety, and sustain workforce participation—especially for mothers—because raising a child stops being a private problem and becomes shared infrastructure.",
];

export function Manifesto() {
  return (
    <section id="manifesto" className="scroll-mt-20 bg-lavender/50 py-20 lg:py-24">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <p className="text-center font-display text-sm font-bold uppercase tracking-[0.2em] text-primary">
          Our Manifesto
        </p>

        {/* lead */}
        <p className="mt-6 text-center font-serif text-2xl font-medium leading-snug text-ink sm:text-3xl">
          Raising a child shouldn&rsquo;t feel improvised and lonely. But families
          are being asked to do everything—work, logistics, the mental load—while
          childcare still runs on patches.
        </p>

        <div className="mt-10 space-y-5 text-lg leading-relaxed text-ink/80">
          {PARAGRAPHS.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {/* closing line */}
        <p className="mt-10 border-t border-black/10 pt-8 text-center font-serif text-2xl font-medium italic leading-snug text-ink sm:text-3xl">
          We&rsquo;re not building just an app. We&rsquo;re building a new
          standard: a global club where{" "}
          <span className="text-primary">care is education.</span> Change
          childhood, and the future gets built differently.
        </p>
      </div>
    </section>
  );
}
