import Image from "next/image";

const PILLARS = [
  {
    title: "Raising Children",
    image: "/images/raising-children.png",
    body: "Children need more than supervision; they need emotionally steady, well-prepared adults who build deep self-trust and competence—so they can grow into their fullest selves.",
  },
  {
    title: "Raising Families",
    image: "/images/raising-families.png",
    body: "Families deserve an upgrade to their whole ecosystem—where quality care and real understanding of children are the norm, not the exception—so raising children feels shared, not lonely.",
  },
  {
    title: "Raising Caregivers",
    image: "/images/raising-caregivers.png",
    body: "Nannies, professional caregivers, and educators deserve respect, training, and real careers—so they can build stable, dignified lives.",
  },
  {
    title: "Raising Society",
    image: "/images/raising-society.png",
    body: "Care for children must be treated as essential infrastructure—so work and opportunity aren’t limited by who can afford care, and the next generation grows up ready to lead.",
  },
];

export function Mission() {
  return (
    <>
      {/* Quote band (sage image with flowers baked in) */}
      <section className="relative">
        <Image
          src="/images/quote-band.png"
          alt=""
          width={1068}
          height={187}
          className="h-40 w-full object-cover sm:h-48 lg:h-56"
        />
        <div className="absolute inset-0 grid place-items-center px-5 text-center">
          <p className="font-serif text-2xl font-medium leading-snug text-ink sm:text-3xl lg:text-[2.5rem]">
            &ldquo;When families rise,{" "}
            <span className="italic text-primary">society rises.</span>&rdquo;
          </p>
        </div>
      </section>

      {/* Why The Raising Club — on a pink panel */}
      <section className="bg-cream py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="rounded-[2.5rem] bg-pink px-6 py-14 lg:px-12">
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
                  className="flex flex-col rounded-3xl bg-white/70 p-5"
                >
                  <h3 className="text-xl leading-tight text-ink">
                    <span className="font-display font-extrabold">Raising </span>
                    <span className="font-serif italic font-semibold">
                      {p.title.replace("Raising ", "")}
                    </span>
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/75">
                    {p.body}
                  </p>
                  <div className="relative mt-5 aspect-[5/4] w-full overflow-hidden rounded-2xl">
                    <Image
                      src={p.image}
                      alt={p.title}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
