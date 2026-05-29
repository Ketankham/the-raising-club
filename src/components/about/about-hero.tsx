import Image from "next/image";
import Link from "next/link";

export function AboutHero() {
  return (
    <section className="bg-cream">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 lg:grid-cols-2 lg:px-8 lg:py-20">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-primary">
            About Us
          </p>
          <h1 className="mt-4 text-4xl leading-[1.14] sm:text-5xl">
            <span className="font-display font-extrabold text-ink">
              We&rsquo;re building the{" "}
            </span>
            <span className="font-serif font-medium text-ink/90">
              modern village for families.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink/75">
            The Raising Club brings families, caregivers, and programs together
            with evidence-based guidance—so raising children feels less
            overwhelming and grounded in what helps them thrive.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href="/get-started"
              className="rounded-full bg-primary px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
            >
              Join The Club
            </Link>
            <Link
              href="#founder"
              className="rounded-full border border-ink/15 px-7 py-3 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
            >
              Meet Our Founder
            </Link>
          </div>
        </div>

        {/* TODO: replace placeholder with the real About hero image */}
        <div className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-[2rem]">
          <Image
            src="/images/for-parents.png"
            alt="A family together"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}
