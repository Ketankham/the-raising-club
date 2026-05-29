import Link from "next/link";

export function Founder() {
  return (
    <section id="founder" className="bg-lavender/50 py-20 lg:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        {/* TODO: replace placeholder with Ara's real headshot */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -left-4 -top-4 grid h-16 w-16 place-items-center rounded-2xl bg-yellow/70 text-2xl">
            ☀️
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=700&q=80"
            alt="Ara V., Founder & Montessori Educator"
            className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-lg"
          />
        </div>

        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-primary">
            Meet Our Founder
          </p>
          <h2 className="mt-3 font-serif text-4xl font-bold text-ink sm:text-5xl">
            Ara V.
          </h2>
          <p className="mt-1 font-display text-sm font-semibold text-ink/70">
            Founder &amp; Montessori Educator
          </p>

          <div className="mt-6 space-y-4 text-ink/75">
            <p>
              Araceli &ldquo;Ara&rdquo; Vazquez is an entrepreneur and educator
              transforming how childcare and early education are understood,
              delivered, and valued. Raised in Mexico in a family shaped by
              resilience and entrepreneurship—one that saw education as a path to
              opportunity—she brings both personal conviction and strategic
              vision to her work.
            </p>
            <p>
              As the founder of The Raising Club, she is building modern
              infrastructure for childhood, connecting families, caregivers, and
              organizations around a higher standard of care. With a background
              in Business Administration, a certification in Montessori
              education, and more than eight years of experience building a
              successful bilingual education program for children in New York
              City, Ara brings together an entrepreneurial mind and deep
              expertise in child development.
            </p>
            <p>
              Through her work, she is raising both the standard and the
              economics of childcare—helping caregivers earn more, families
              access better options, and organizations operate with stronger,
              more efficient models. She is helping redefine childcare as a
              high-value sector with the power to drive meaningful economic and
              social progress at scale.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/get-started"
              className="rounded-full bg-primary px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
            >
              Join the Club
            </Link>
            <Link
              href="#manifesto"
              className="rounded-full border border-ink/15 px-7 py-3 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
            >
              Read Our Manifesto
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
