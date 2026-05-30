import Link from "next/link";
import { Calendar, ImageIcon, MapPin, Users } from "lucide-react";
import { SaveButton } from "./save-button";
import {
  ageRangeLabel,
  locationLabel,
  priceLabel,
  shortDateLabel,
} from "@/lib/events/format";
import { PARTICIPATION_TAGS, type EventListItem } from "@/lib/events/types";

export function EventCard({ event }: { event: EventListItem }) {
  const href = `/events/${event.slug}`;

  return (
    <article className="relative flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative">
        <Link href={href} className="block aspect-[16/10] overflow-hidden bg-lavender">
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

        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-ink backdrop-blur">
            {PARTICIPATION_TAGS[event.participationType]}
          </span>
          {event.isFeatured && (
            <span className="rounded-full bg-yellow px-2.5 py-1 text-xs font-semibold text-ink">
              Featured
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3">
          <SaveButton eventId={event.id} initialSaved={event.isSaved} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <Link href={href}>
          <h3 className="line-clamp-2 font-display text-lg font-bold leading-snug text-ink">
            {event.title}
          </h3>
        </Link>
        {event.hostName && (
          <p className="-mt-1 text-xs font-medium text-ink-soft">by {event.hostName}</p>
        )}
        {event.summary && (
          <p className="line-clamp-2 text-sm text-ink-soft">{event.summary}</p>
        )}

        <ul className="mt-1 space-y-1.5 text-sm text-ink-soft">
          {event.nextSession && (
            <li className="flex items-center gap-2">
              <Calendar size={15} className="shrink-0 text-ink-soft/70" />
              {shortDateLabel(event.nextSession.startsAt)}
            </li>
          )}
          <li className="flex items-center gap-2">
            <Users size={15} className="shrink-0 text-ink-soft/70" />
            {ageRangeLabel(event.ageMinMonths, event.ageMaxMonths)}
          </li>
          {event.location && (
            <li className="flex items-center gap-2">
              <MapPin size={15} className="shrink-0 text-ink-soft/70" />
              {locationLabel(event.location)}
            </li>
          )}
        </ul>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-display text-base font-bold text-ink">
            {priceLabel(event.priceModel, event.priceCents, event.currency)}
          </span>
          <Link
            href={href}
            className="rounded-full bg-[#9cc766] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#8bb957]"
          >
            Enroll Now
          </Link>
        </div>
      </div>
    </article>
  );
}
