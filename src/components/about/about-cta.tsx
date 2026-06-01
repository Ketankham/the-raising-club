import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function AboutCta() {
  return (
    <section className="bg-cream py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-sage px-6 py-16 text-center lg:px-12">
          <h2 className="mx-auto max-w-3xl text-3xl leading-tight text-ink sm:text-4xl">
            <span className="font-display font-extrabold">
              Care shouldn&rsquo;t be improvised—
            </span>
            <span className="font-serif font-medium italic">
              and nobody should do it alone.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ink/75">
            Join a growing community of intentional families, trained caregivers,
            and programs building something better—together.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link
              href="/get-started"
              className="rounded-full bg-yellow px-8 py-3.5 text-sm font-semibold text-ink shadow-sm transition-[filter] hover:brightness-95"
            >
              Join the Club
            </Link>
            <Link
              href="/manifesto"
              className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-white px-7 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
            >
              Read our Manifesto <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
