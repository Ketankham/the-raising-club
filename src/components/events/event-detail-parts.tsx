// Pure presentational pieces for the event detail page. No "use client" and no
// server-only APIs, so they render fine in BOTH the server detail-A view and the
// client tabbed detail-B view.
import { Calendar, Clock, Download, ExternalLink, FileText, MapPin, Users } from "lucide-react";
import {
  ageRangeLabel,
  sessionDateTimeLabel,
  shortDateLabel,
} from "@/lib/events/format";
import type { EventDetail } from "@/lib/events/types";

export function EventDetailsCard({ event }: { event: EventDetail }) {
  const enrolled =
    event.childCapacity != null
      ? ` · ${event.confirmedChildCount}/${event.childCapacity} enrolled`
      : "";
  const next = event.nextSession;

  return (
    <div className="rounded-2xl bg-[#fbf3df] p-5">
      <h3 className="mb-3 font-display text-base font-bold text-ink">Event Details</h3>
      <ul className="space-y-3 text-sm text-ink">
        {next && (
          <li className="flex items-start gap-3">
            <Calendar size={17} className="mt-0.5 shrink-0 text-ink-soft" />
            <span>
              <span className="block text-ink-soft">When</span>
              {shortDateLabel(next.startsAt, event.timezone)}
            </span>
          </li>
        )}
        {next && (
          <li className="flex items-start gap-3">
            <Clock size={17} className="mt-0.5 shrink-0 text-ink-soft" />
            <span>
              <span className="block text-ink-soft">Time</span>
              {new Date(next.startsAt).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                timeZone: event.timezone,
              })}
            </span>
          </li>
        )}
        <li className="flex items-start gap-3">
          <Users size={17} className="mt-0.5 shrink-0 text-ink-soft" />
          <span>
            <span className="block text-ink-soft">Age range</span>
            {ageRangeLabel(event.ageMinMonths, event.ageMaxMonths)}
            {enrolled}
          </span>
        </li>
        <li className="flex items-start gap-3">
          <MapPin size={17} className="mt-0.5 shrink-0 text-ink-soft" />
          <span>
            <span className="block text-ink-soft">Location</span>
            {event.locationFull?.kind === "digital"
              ? "Online"
              : event.locationFull?.neighborhood || event.locationFull?.address || "In-person"}
            {event.locationFull?.kind !== "digital" && " · In-Person"}
          </span>
        </li>
      </ul>
    </div>
  );
}

export function WhatToExpect({ event }: { event: EventDetail }) {
  if (!event.whatToExpect) return null;
  return (
    <section>
      <h3 className="mb-2 font-display text-lg font-bold text-ink">What to Expect</h3>
      <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">
        {event.whatToExpect}
      </p>
    </section>
  );
}

export function ScheduleBlock({ event }: { event: EventDetail }) {
  if (!event.agenda?.length) {
    return <p className="text-sm text-ink-soft">A detailed schedule will be shared soon.</p>;
  }
  return (
    <ol className="space-y-4">
      {event.agenda.map((b, i) => (
        <li key={i} className="flex gap-4">
          <div className="w-20 shrink-0 text-sm font-semibold text-ink">{b.time ?? ""}</div>
          <div className="border-l-2 border-[#9cc766] pl-4">
            <p className="font-display text-sm font-bold text-ink">{b.title}</p>
            {b.description && <p className="mt-0.5 text-sm text-ink-soft">{b.description}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ResourcesBlock({ event }: { event: EventDetail }) {
  if (!event.resources?.length) {
    return (
      <p className="text-sm text-ink-soft">
        Materials shared by the host will appear here to support your experience.
      </p>
    );
  }
  return (
    <>
      <p className="mb-4 text-sm text-ink-soft">
        Materials shared by the host to support your experience.
      </p>
      <ul className="space-y-2">
        {event.resources.map((r) => {
          const isFile = r.kind === "file" && r.filePath;
          const href = isFile ? r.filePath! : r.url ?? "#";
          return (
            <li key={r.id}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm shadow-sm transition hover:shadow"
              >
                <span className="flex items-center gap-3 text-ink">
                  <FileText size={17} className="text-[#7ba84f]" />
                  {r.label}
                </span>
                {isFile ? (
                  <Download size={16} className="text-ink-soft" />
                ) : (
                  <ExternalLink size={16} className="text-ink-soft" />
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function LocationBlock({ event, canJoin }: { event: EventDetail; canJoin: boolean }) {
  const loc = event.locationFull;
  if (!loc) return null;

  if (loc.kind === "digital") {
    return (
      <div className="space-y-3">
        <h3 className="font-display text-base font-bold text-ink">How to join</h3>
        {event.nextSession && (
          <p className="text-sm text-ink-soft">
            {sessionDateTimeLabel(event.nextSession.startsAt, event.nextSession.endsAt, event.timezone)}
          </p>
        )}
        {loc.joinInstructions && <p className="text-sm text-ink-soft">{loc.joinInstructions}</p>}
        {canJoin && loc.joinUrl ? (
          <a
            href={loc.joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full bg-[#9cc766] px-5 py-2 text-sm font-semibold text-white hover:bg-[#8bb957]"
          >
            Join online
          </a>
        ) : (
          <p className="text-xs text-ink-soft/80">
            The join link is shared with registered attendees.
          </p>
        )}
      </div>
    );
  }

  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    loc.address || loc.neighborhood || "",
  )}`;
  return (
    <div className="space-y-3">
      <h3 className="font-display text-base font-bold text-ink">Location</h3>
      <div>
        {loc.neighborhood && <p className="font-semibold text-ink">{loc.neighborhood}</p>}
        {loc.address && <p className="text-sm text-ink-soft">{loc.address}</p>}
      </div>
      <div className="grid h-40 place-items-center rounded-xl bg-lavender text-ink-soft/50">
        <MapPin size={28} />
      </div>
      <a
        href={mapsHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink hover:border-[#9cc766]"
      >
        Get Directions
      </a>
      {loc.arrivalNotes && (
        <div className="pt-2">
          <p className="font-display text-sm font-bold text-ink">Parking &amp; Access</p>
          <p className="text-sm text-ink-soft">{loc.arrivalNotes}</p>
        </div>
      )}
    </div>
  );
}
