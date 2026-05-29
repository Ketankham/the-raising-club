import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";

type Audience = {
  title: string;
  tagline: string;
  image: string;
  cardBg: string;
  cta: { label: string; href: string };
  points: { heading: string; body: string }[];
};

const AUDIENCES: Audience[] = [
  {
    title: "For Parents",
    tagline:
      "Find caregivers and other families who feel like part of your parenting team—so you’re supported in raising your child, not juggling it all alone.",
    image: "/images/for-parents.png",
    cardBg: "bg-lavender/60",
    cta: { label: "Get Started As A Family", href: "/get-started?role=family" },
    points: [
      {
        heading: "Care You Can Feel Confident In",
        body: "See caregivers vetted for safety and experience, then use smart filters to find someone who fits your child and your family—not just your schedule.",
      },
      {
        heading: "Learn & Grow Together with TRC",
        body: "Learn about child development with TRC, and invite the nanny you already love into TRC training so you share the same approach.",
      },
      {
        heading: "The Kind of Help Your Family Actually Needs",
        body: "Choose caregivers whose strengths match your priorities—whether that’s early learning support, tutoring, home organization, or family meals.",
      },
      {
        heading: "Build Your Small Village",
        body: "Connect with nearby families for nanny shares, shared care, and micro-programs, so your child has a stable circle of care and friendship.",
      },
    ],
  },
  {
    title: "For Caregivers",
    tagline:
      "Raise children with purpose, and build a real career in early childhood while you do it.",
    image: "/images/for-caregivers.png",
    cardBg: "bg-olive/20",
    cta: {
      label: "Become A TRC Caregiver",
      href: "/get-started?role=caregiver",
    },
    points: [
      {
        heading: "Stand Out as a Professional",
        body: "Create a profile that highlights your experience, training, and specialties so families and programs know you’re the right hire.",
      },
      {
        heading: "Grow with TRC Training & Badges",
        body: "Earn TRC badges in child development and specialized family support to unlock premium, higher-paying roles.",
      },
      {
        heading: "Fair Pay, Clear Expectations",
        body: "Find roles where pay, hours, and responsibilities are transparent from the start.",
      },
      {
        heading: "Families, Programs & Community That Fit You",
        body: "Connect with families, daycares, centers, and fellow TRC caregivers—for roles, playdates, and a professional community that respects your work and shares your values.",
      },
    ],
  },
  {
    title: "For Centers & Programs",
    tagline:
      "Solve staffing and training for your daycare, preschool, and after-school programs in one place.",
    image: "/images/for-centers.png",
    cardBg: "bg-primary-soft/20",
    cta: {
      label: "Hire & Train Educators",
      href: "/get-started?role=organization",
    },
    points: [
      {
        heading: "Trained & Credentialed Educators from Day One",
        body: "Hire early childhood and out-of-school educators and caregivers with verified degrees, certifications, or TRC training.",
      },
      {
        heading: "Build a Reliable Staffing Bench with TRC Filters",
        body: "Use TRC filters to keep a ready pool of floaters, substitutes, and out-of-school staff matched to your age groups and hours, so you don’t have to cancel classes or close rooms at the last minute.",
      },
      {
        heading: "Upskill the Team You Already Have",
        body: "Enroll your classroom, after-school, and enrichment staff in TRC training and badges to raise quality in every setting.",
      },
      {
        heading: "A Program Parents Brag About",
        body: "Show families a stable, trained team grounded in child development and out-of-school learning that sets you apart.",
      },
    ],
  },
];

export function Audiences() {
  return (
    <section id="built-for-everyone" className="bg-cream py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-extrabold text-ink sm:text-4xl lg:text-5xl">
            Built for everyone raising children
          </h2>
          <p className="mt-5 text-lg text-ink/75">
            One club where the adults around each child connect, collaborate, and
            grow together.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {AUDIENCES.map((a) => (
            <div
              key={a.title}
              className={`flex flex-col overflow-hidden rounded-3xl ${a.cardBg} p-5`}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
                <Image
                  src={a.image}
                  alt={a.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>

              <h3 className="mt-5 font-display text-2xl font-extrabold text-ink">
                {a.title}
              </h3>
              <p className="mt-2 text-sm text-ink/75">{a.tagline}</p>

              <ul className="mt-5 flex-1 space-y-4">
                {a.points.map((p) => (
                  <li key={p.heading} className="flex gap-2.5">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <div>
                      <h4 className="font-display text-sm font-bold text-ink">
                        {p.heading}
                      </h4>
                      <p className="mt-0.5 text-sm leading-relaxed text-ink/70">
                        {p.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <Link
                href={a.cta.href}
                className="mt-7 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-primary-hover"
              >
                {a.cta.label}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
