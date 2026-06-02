"use client";

import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { CaregiverCard } from "./caregiver-card";
import { haversineMiles } from "@/lib/location";
import { requestGeolocation } from "@/hooks/use-geolocation";
import type { CaregiverCard as Caregiver, OwnJobOption } from "@/lib/marketplace/types";

interface GeoPos { lat: number; lng: number }

export function CaregiverGrid({
  caregivers,
  canInvite,
  jobs,
}: {
  caregivers: Caregiver[];
  canInvite: boolean;
  jobs: OwnJobOption[];
}) {
  const [geoState, setGeoState] = useState<"idle" | "loading" | "ok" | "denied">("idle");
  const [userPos, setUserPos] = useState<GeoPos | null>(null);

  async function handleNearMe() {
    if (geoState === "ok") {
      // Toggle off
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

  const withDistance = caregivers.map((c) => ({
    c,
    distanceMiles:
      userPos && c.lat != null && c.lng != null
        ? haversineMiles(userPos.lat, userPos.lng, c.lat, c.lng)
        : null,
  }));

  const sorted =
    userPos
      ? [...withDistance].sort((a, b) => {
          if (a.distanceMiles == null) return 1;
          if (b.distanceMiles == null) return -1;
          return a.distanceMiles - b.distanceMiles;
        })
      : withDistance;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-soft">
          <span className="rounded-full bg-mint px-2.5 py-0.5 font-semibold text-ink">{caregivers.length}</span>{" "}
          {caregivers.length === 1 ? "caregiver" : "caregivers"}
          {userPos ? " · sorted by distance" : " · Matched to your search and filters"}
        </p>
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

      {caregivers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 bg-white/50 p-12 text-center">
          <p className="font-display text-lg font-bold text-ink">No caregivers found</p>
          <p className="mt-1 text-sm text-ink-soft">Try adjusting your filters or check back soon.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map(({ c, distanceMiles }) => (
            <CaregiverCard
              key={c.userId}
              c={c}
              canInvite={canInvite}
              jobs={jobs}
              distanceMiles={distanceMiles ?? undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
