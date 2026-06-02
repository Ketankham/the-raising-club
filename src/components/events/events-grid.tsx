"use client";

import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { EventCard } from "./event-card";
import { haversineMiles } from "@/lib/location";
import { requestGeolocation } from "@/hooks/use-geolocation";
import type { EventListItem } from "@/lib/events/types";

interface GeoPos { lat: number; lng: number }

export function EventsGrid({ events }: { events: EventListItem[] }) {
  const [geoState, setGeoState] = useState<"idle" | "loading" | "ok" | "denied">("idle");
  const [userPos, setUserPos] = useState<GeoPos | null>(null);

  async function handleNearMe() {
    if (geoState === "ok") {
      setUserPos(null);
      setGeoState("idle");
      return;
    }
    setGeoState("loading");
    try {
      const pos = await requestGeolocation();
      setUserPos(pos);
      setGeoState("ok");
    } catch {
      setGeoState("denied");
      setTimeout(() => setGeoState("idle"), 3000);
    }
  }

  const withDistance = events.map((ev) => ({
    ev,
    distanceMiles:
      userPos && ev.location?.lat != null && ev.location?.lng != null
        ? haversineMiles(userPos.lat, userPos.lng, ev.location.lat, ev.location.lng)
        : null,
  }));

  const sorted =
    userPos
      ? [...withDistance].sort((a, b) => {
          // Online events go to the bottom when sorting by distance
          if (a.ev.location?.kind === "digital") return 1;
          if (b.ev.location?.kind === "digital") return -1;
          if (a.distanceMiles == null) return 1;
          if (b.distanceMiles == null) return -1;
          return a.distanceMiles - b.distanceMiles;
        })
      : withDistance;

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <h2 className="font-display text-lg font-bold text-ink">Live Events</h2>
        <span className="rounded-full bg-[#dcebbf] px-2.5 py-0.5 text-xs font-semibold text-[#5b7a2e]">
          {events.length} event{events.length === 1 ? "" : "s"}
        </span>
        <div className="ml-auto">
          <button
            type="button"
            onClick={handleNearMe}
            disabled={geoState === "loading"}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              geoState === "ok"
                ? "border-olive bg-olive/10 text-olive"
                : geoState === "denied"
                  ? "border-red-300 bg-red-50 text-red-600"
                  : "border-ink/15 text-ink-soft hover:border-ink/30 hover:text-ink"
            }`}
          >
            {geoState === "loading" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <MapPin className="h-3.5 w-3.5" />
            )}
            {geoState === "ok" ? "Sorted by distance" : geoState === "denied" ? "Location unavailable" : "Near me"}
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 bg-white/50 p-12 text-center">
          <p className="font-display text-lg font-bold text-ink">No events found</p>
          <p className="mt-1 text-sm text-ink-soft">
            Try adjusting your filters or check back soon for new gatherings.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map(({ ev, distanceMiles }) => (
            <EventCard key={ev.id} event={ev} distanceMiles={distanceMiles ?? undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
