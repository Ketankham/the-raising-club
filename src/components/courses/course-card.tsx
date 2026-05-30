import Link from "next/link";
import { BookOpen, Clock, ImageIcon, Users } from "lucide-react";
import { ageRangeLabel, coursePriceLabel, compareAtLabel, durationLabel } from "@/lib/courses/format";
import type { CourseListItem } from "@/lib/courses/queries";

export function CourseCard({ course }: { course: CourseListItem }) {
  const href = `/courses/${course.slug}`;
  const compare = compareAtLabel(course.compareAtPriceCents, course.currency);
  const duration = durationLabel(course.estimatedLearningMinutes);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative">
        <Link href={href} className="block aspect-[16/10] overflow-hidden bg-lavender">
          {course.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.coverImageUrl} alt={course.title} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-ink-soft/30">
              <ImageIcon size={40} />
            </div>
          )}
        </Link>
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-ink backdrop-blur">Course</span>
          {course.isFeatured && (
            <span className="rounded-full bg-yellow px-2.5 py-1 text-xs font-semibold text-ink">Featured</span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <Link href={href}>
          <h3 className="line-clamp-2 font-display text-lg font-bold leading-snug text-ink">{course.title}</h3>
        </Link>
        {course.summary && <p className="line-clamp-2 text-sm text-ink-soft">{course.summary}</p>}

        <ul className="mt-1 space-y-1.5 text-sm text-ink-soft">
          <li className="flex items-center gap-2">
            <BookOpen size={15} className="shrink-0 text-ink-soft/70" />
            {course.moduleCount} module{course.moduleCount === 1 ? "" : "s"}
          </li>
          {duration && (
            <li className="flex items-center gap-2">
              <Clock size={15} className="shrink-0 text-ink-soft/70" />
              {duration}
            </li>
          )}
          {(course.ageMinMonths != null || course.ageMaxMonths != null) && (
            <li className="flex items-center gap-2">
              <Users size={15} className="shrink-0 text-ink-soft/70" />
              {ageRangeLabel(course.ageMinMonths, course.ageMaxMonths)}
            </li>
          )}
        </ul>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="flex items-baseline gap-2">
            <span className="font-display text-base font-bold text-ink">
              {coursePriceLabel(course.isFree, course.priceCents, course.currency)}
            </span>
            {compare && <span className="text-sm text-ink-soft/60 line-through">{compare}</span>}
          </span>
          <Link
            href={href}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Enroll Now
          </Link>
        </div>
      </div>
    </article>
  );
}
