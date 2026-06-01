"use client";

import { useSyncExternalStore } from "react";

type Mode = "shortdate" | "date" | "time" | "clocktime" | "range";

const noop = () => () => {};
// false during SSR + hydration, true after mount — lets us render the event's
// timezone on the server (stable, no hydration mismatch) then switch to the
// viewer's local timezone once mounted.
function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}

function fmt(startIso: string, endIso: string | null | undefined, mode: Mode, tz?: string): string {
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return "";

  if (mode === "shortdate") {
    return start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: tz });
  }
  if (mode === "date") {
    return start.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: tz });
  }
  if (mode === "time") {
    return start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short", timeZone: tz });
  }
  if (mode === "clocktime") {
    // Card chip: bare time, no timezone label ("9:00 AM").
    return start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz });
  }
  // range: "Saturday, May 9 · 9:00–10:30 AM EDT"
  const datePart = start.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: tz });
  if (!endIso) {
    const s = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short", timeZone: tz });
    return `${datePart} · ${s}`;
  }
  const end = new Date(endIso);
  const s = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz });
  const e = end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short", timeZone: tz });
  return `${datePart} · ${s}–${e}`;
}

/**
 * Renders an event instant in the VIEWER's local timezone (with a tz label for
 * time modes). Falls back to the event's timezone for SSR / no-JS so the markup
 * is stable and there's no hydration flash.
 */
export function LocalDateTime({
  startIso,
  endIso,
  mode,
  fallbackTz,
}: {
  startIso: string;
  endIso?: string | null;
  mode: Mode;
  fallbackTz?: string;
}) {
  const mounted = useMounted();
  return <span>{fmt(startIso, endIso, mode, mounted ? undefined : fallbackTz)}</span>;
}
