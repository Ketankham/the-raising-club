import Link from "next/link";
import { BookOpen, Clock, Heart, ImageIcon, Layers } from "lucide-react";
import { coursePriceLabel, compareAtLabel, durationLabel } from "@/lib/courses/format";
import type { CatalogItem } from "@/lib/courses/queries";

/**
 * Browse-grid card for a course or a bundle, styled to the Figma "Browse
 * Courses" screen (warm card, orange accent, status + type badges).
 */
export function CatalogCard({ item }: { item: CatalogItem }) {
  const isBundle = item.kind === "bundle";
  // Bundles have no public detail page yet — route their CTA into onboarding.
  const href = isBundle ? "/onboarding" : `/courses/${item.slug}`;
  const compare = compareAtLabel(item.compareAtPriceCents, item.currency);
  const duration = durationLabel(item.estimatedLearningMinutes ?? null);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-[#efdcc4] bg-[#f7ecdd] shadow-sm transition-shadow hover:shadow-md">
      <div className="relative">
        <Link href={href} className="block aspect-[16/10] overflow-hidden bg-lavender">
          {item.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.coverImageUrl} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-ink-soft/30">
              <ImageIcon size={40} />
            </div>
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2">
          {item.isFeatured ? (
            <span className="rounded-full bg-yellow px-2.5 py-1 text-xs font-semibold text-ink">Featured</span>
          ) : (
            compare && (
              <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-white">Sale</span>
            )
          )}
          <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink backdrop-blur">
            {isBundle ? "Bundle" : "Course"}
          </span>
        </div>

        {/* Decorative wishlist heart (matches the design; saving lands later). */}
        <span
          aria-hidden
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-primary shadow-sm backdrop-blur"
        >
          <Heart size={17} />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <Link href={href}>
          <h3 className="line-clamp-2 font-display text-lg font-bold leading-snug text-ink">{item.title}</h3>
        </Link>
        {item.summary && <p className="line-clamp-2 text-sm text-ink-soft">{item.summary}</p>}

        <ul className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-ink-soft">
          {isBundle ? (
            <li className="flex items-center gap-2">
              <Layers size={15} className="shrink-0 text-primary" />
              {item.courseCount} course{item.courseCount === 1 ? "" : "s"}
            </li>
          ) : (
            <>
              {duration && (
                <li className="flex items-center gap-2">
                  <Clock size={15} className="shrink-0 text-primary" />
                  {duration}
                </li>
              )}
              <li className="flex items-center gap-2">
                <BookOpen size={15} className="shrink-0 text-primary" />
                {item.moduleCount} module{item.moduleCount === 1 ? "" : "s"}
              </li>
            </>
          )}
        </ul>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="flex items-baseline gap-2">
            <span className="font-display text-xl font-bold text-ink">
              {coursePriceLabel(item.isFree, item.priceCents, item.currency)}
            </span>
            {compare && <span className="text-sm text-ink-soft/60 line-through">{compare}</span>}
          </span>
          <Link
            href={href}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Enroll Now
          </Link>
        </div>
      </div>
    </article>
  );
}
