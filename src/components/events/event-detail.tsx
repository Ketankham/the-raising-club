import Link from "next/link";
import { ArrowLeft, CalendarCheck, ImageIcon, ShieldCheck } from "lucide-react";
import type { EventDetail as EventDetailType, MyRegistration, RegistrationDetails } from "@/lib/events/types";
import { PARTICIPATION_TAGS } from "@/lib/events/types";
import { priceLabel } from "@/lib/events/format";
import { SaveButton } from "./save-button";
import { ShareButton } from "./share-button";
import { LocalDateTime } from "./local-datetime";
import { DetailTabs } from "./detail-tabs";
import {
  EventDetailsCard,
  InstructorsBlock,
  LocationBlock,
  ScheduleBlock,
  WhatToExpect,
} from "./event-detail-parts";

export function EventDetail({
  event,
  registration,
  registrationDetails,
}: {
  event: EventDetailType;
  registration: MyRegistration | null;
  registrationDetails?: RegistrationDetails | null;
}) {
  const registered = !!registration && !!registrationDetails;
  const price = priceLabel(event.priceModel, event.priceCents, event.currency);

  return (
    <article className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
      <Link
        href="/events"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={16} /> Back to events
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-lavender">
        <div className="aspect-[16/9] w-full">
          {event.heroImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.heroImageUrl} alt={event.title} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-ink-soft/30">
              <ImageIcon size={48} />
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink backdrop-blur">
            {PARTICIPATION_TAGS[event.participationType]}
          </span>
          {event.isFeatured && (
            <span className="rounded-full bg-yellow px-3 py-1 text-xs font-semibold text-ink">
              Featured
            </span>
          )}
        </div>
        <div className="absolute right-4 top-4 flex gap-2">
          <ShareButton title={event.title} />
          <SaveButton eventId={event.id} initialSaved={event.isSaved} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
        <h1 className="max-w-2xl font-display text-2xl font-bold text-ink lg:text-3xl">
          {event.title}
        </h1>
        <span className="font-display text-xl font-bold text-ink">{price}</span>
      </div>

      {event.hostName && (
        <p className="mt-1.5 text-sm text-ink-soft">
          Hosted by{" "}
          {event.hostType === "organization" && event.hostOrgId && event.hostOrgPublished ? (
            <Link
              href={`/organization/${event.hostOrgId}`}
              className="font-semibold text-ink hover:text-[#7ba84f]"
            >
              {event.hostName}
            </Link>
          ) : (
            <span className="font-semibold text-ink">{event.hostName}</span>
          )}
        </p>
      )}

      {registered ? (
        <div className="mt-6">
          <DetailTabs event={event} registration={registrationDetails!} />
        </div>
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Main */}
          <div className="space-y-7">
            <EventDetailsCard event={event} />
            <WhatToExpect event={event} />
            <InstructorsBlock event={event} />
            {event.agenda.length > 0 && (
              <section>
                <h3 className="mb-3 font-display text-lg font-bold text-ink">Schedule</h3>
                <ScheduleBlock event={event} />
              </section>
            )}
            <section>
              <LocationBlock event={event} canJoin={false} />
            </section>
          </div>

          {/* Sticky sidebar CTA */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-baseline justify-between">
                <span className="font-display text-2xl font-bold text-ink">{price}</span>
                {event.childCapacity != null && (
                  <span className="text-sm text-ink-soft">
                    {event.confirmedChildCount}/{event.childCapacity} enrolled
                  </span>
                )}
              </div>
              {event.nextSession && (
                <p className="mb-4 text-sm text-ink-soft">
                  <LocalDateTime
                    startIso={event.nextSession.startsAt}
                    endIso={event.nextSession.endsAt}
                    mode="range"
                    fallbackTz={event.timezone}
                  />
                </p>
              )}
              <Link
                href={`/events/${event.slug}/register`}
                className="block rounded-full bg-[#9cc766] py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#8bb957]"
              >
                {event.requiresApproval ? "Request to join" : "Register now"}
              </Link>
              <div className="mt-4 space-y-2 text-xs text-ink-soft">
                <p className="flex items-center gap-2">
                  <CalendarCheck size={15} className="text-[#7ba84f]" />
                  Free cancellation up to {event.cancellationCutoffHours} hours before
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-[#7ba84f]" />
                  Secure checkout · receipt emailed
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </article>
  );
}
