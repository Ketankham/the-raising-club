import Link from "next/link";

export const JOIN_OPTIONS = [
  {
    label: "Join as a Family",
    sub: "Find care and learn with TRC.",
    href: "/get-started?role=family",
  },
  {
    label: "Join as a Caregiver",
    sub: "Build your career and training.",
    href: "/get-started?role=caregiver",
  },
  {
    label: "Join as an Organization",
    sub: "Hire and upskill your team.",
    href: "/get-started?role=organization",
  },
];

export function JoinCards({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-x-6 gap-y-5 ${className}`}>
      {JOIN_OPTIONS.map((opt) => (
        <div key={opt.label} className="flex flex-col gap-1.5">
          <Link
            href={opt.href}
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
          >
            {opt.label}
          </Link>
          <span className="px-1 text-xs text-ink/60">{opt.sub}</span>
        </div>
      ))}
    </div>
  );
}
