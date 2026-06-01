import Link from "next/link";
import { CalendarDays, Clock, Gem, ImageIcon, MapPin } from "lucide-react";
import { SaveButton } from "./save-button";
import { LocalDateTime } from "./local-datetime";
import { ageRangeLabel, locationLabel, priceLabel } from "@/lib/events/format";
import { PARTICIPATION_TAGS, type EventListItem } from "@/lib/events/types";

// Events use the lavender/purple accent from the Figma "Upcoming Events" screen.
const PURPLE = "#baaae1";
const PURPLE_ICON = "#a48fd6";

export function EventCard({ event }: { event: EventListItem }) {
  const href = `/events/${event.slug}`;
  const included = event.priceModel === "included" || event.priceCents === 0;

  return (
    <article className="flex flex-col rounded-3xl border border-black/5 bg-[#f2f0f6] p-3 shadow-sm transition-shadow hover:shadow-md">
      {/* Inset, rounded hero — card background frames the image (per Figma). */}
      <div className="relative">
        <Link href={href} className="block aspect-[16/10] overflow-hidden rounded-2xl bg-lavender">
          {event.heroImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.heroImageUrl}
              alt={event.title}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-ink-soft/30">
              <ImageIcon size={40} />
            </div>
          )}
        </Link>

        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          {event.isFeatured && (
            <span
              className="rounded-full px-2.5 py-1 text-xs font-semibold text-white"
              style={{ background: PURPLE }}
            >
              Featured
            </span>
          )}
          <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink backdrop-blur">
            {PARTICIPATION_TAGS[event.participationType]}
          </span>
        </div>

        <div className="absolute right-2.5 top-2.5">
          <SaveButton eventId={event.id} initialSaved={event.isSaved} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-1.5 pb-1 pt-3.5">
        <Link href={href}>
          <h3 className="line-clamp-2 font-display text-lg font-bold leading-snug text-ink">
            {event.title}
          </h3>
        </Link>
        {event.summary && (
          <p className="line-clamp-3 text-sm leading-relaxed text-ink-soft">{event.summary}</p>
        )}

        <ul className="mt-1 space-y-2 text-sm text-ink-soft">
          {event.nextSession && (
            <li className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
              <span className="flex items-center gap-2">
                <CalendarDays size={15} className="shrink-0" style={{ color: PURPLE_ICON }} />
                <LocalDateTime startIso={event.nextSession.startsAt} mode="shortdate" />
              </span>
              <span className="flex items-center gap-2">
                <Clock size={15} className="shrink-0" style={{ color: PURPLE_ICON }} />
                <LocalDateTime startIso={event.nextSession.startsAt} mode="clocktime" />
              </span>
            </li>
          )}
          <li className="flex items-center gap-2">
            <Gem size={15} className="shrink-0" style={{ color: PURPLE_ICON }} />
            {ageRangeLabel(event.ageMinMonths, event.ageMaxMonths)}
          </li>
          {event.location && (
            <li className="flex items-center gap-2">
              <MapPin size={15} className="shrink-0" style={{ color: PURPLE_ICON }} />
              {locationLabel(event.location)}
            </li>
          )}
        </ul>

        <div className="mt-auto flex items-center justify-between pt-3">
          {included ? (
            <span className="rounded-full bg-[#aecb6a] px-3.5 py-1.5 text-sm font-semibold text-white">
              Included
            </span>
          ) : (
            <span className="font-display text-xl font-bold text-ink">
              {priceLabel(event.priceModel, event.priceCents, event.currency)}
            </span>
          )}
          <Link
            href={href}
            className="rounded-full px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: PURPLE }}
          >
            Enroll Now
          </Link>
        </div>
      </div>
    </article>
  );
}
