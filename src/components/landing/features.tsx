import {
  ShieldCheck,
  Sparkles,
  Users,
  GraduationCap,
  Building2,
  LifeBuoy,
} from "lucide-react";

const FEATURES = [
  {
    Icon: ShieldCheck,
    color: "bg-olive/30",
    title: "Layered Safety & Screening",
    body: "We verify IDs and references, offer optional background checks, and surface practical safety guidance—so families can feel confident and at peace.",
  },
  {
    Icon: Sparkles,
    color: "bg-purple/30",
    title: "Smart Matching",
    body: "We match families, caregivers, and programs—including families with families and caregivers with caregivers—so each child’s circle of care fits their needs.",
  },
  {
    Icon: Users,
    color: "bg-pink",
    title: "Nanny Shares & Micro-Programs",
    body: "Create or join nanny shares, learning pods, and after-school care with families who share your neighborhood, schedule, and priorities.",
  },
  {
    Icon: GraduationCap,
    color: "bg-yellow/40",
    title: "TRC Training & Badges",
    body: "Educators bring degrees & certifications; TRC adds science-backed training and badges that make all expertise visible to families and programs at a glance.",
  },
  {
    Icon: Building2,
    color: "bg-primary-soft/30",
    title: "Staffing for Daycares & Programs",
    body: "Daycares, preschools, and after-school programs use TRC to hire new educators and upskill existing teams, keeping classrooms and activities reliably staffed.",
  },
  {
    Icon: LifeBuoy,
    color: "bg-mint",
    title: "Support & Simple Logistics",
    body: "Access TRC guidance when questions come up, and manage payments in one place with clear rates and fewer awkward money talks.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-cream py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-extrabold text-ink sm:text-4xl lg:text-5xl">
            Everything You Need
          </h2>
          <p className="mt-5 text-lg text-ink/75">
            Our platform brings together everything needed to build safe, stable,
            high-quality care around each child.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ Icon, color, title, body }) => (
            <div
              key={title}
              className="rounded-3xl border border-black/5 bg-white p-7 shadow-sm transition-transform hover:-translate-y-1"
            >
              <span className={`inline-grid h-12 w-12 place-items-center rounded-2xl ${color}`}>
                <Icon size={22} className="text-ink" />
              </span>
              <h3 className="mt-5 font-display text-lg font-bold text-ink">
                {title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink/70">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
