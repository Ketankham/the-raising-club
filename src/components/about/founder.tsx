import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { StarBurst } from "@/components/about/star-burst";

export function Founder() {
  return (
    <section id="founder" className="bg-lavender/50 py-20 lg:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <div className="relative mx-auto w-full max-w-sm">
          <StarBurst className="absolute -left-7 -top-7 z-10 h-20 w-20 text-yellow" />
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[2rem] shadow-lg">
            <Image
              src="/images/ara.png"
              alt="Ara V., Founder & Montessori Educator"
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover"
            />
          </div>
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
