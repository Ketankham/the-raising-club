import Link from "next/link";

export function AboutCta() {
  return (
    <section className="bg-cream py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="rounded-[2.5rem] bg-pink px-6 py-16 text-center lg:px-12">
          <h2 className="mx-auto max-w-3xl font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
            Care shouldn&rsquo;t be improvised—and nobody should do it alone.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl font-serif text-lg font-medium text-ink/80">
            Join a growing community of intentional families, trained caregivers,
            and programs building something better—together.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link
              href="/get-started"
              className="rounded-full bg-primary px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
            >
              Join the Club
            </Link>
            <Link
              href="/manifesto"
              className="rounded-full border border-ink/15 bg-white/60 px-7 py-3 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
            >
              Read Our Manifesto
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
