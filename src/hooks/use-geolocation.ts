"use client";

import { useEffect, useState } from "react";

export interface GeoPosition {
  lat: number;
  lng: number;
}

type GeoState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; position: GeoPosition }
  | { status: "denied" }
  | { status: "unavailable" };

export function useGeolocation(): GeoState {
  const [state, setState] = useState<GeoState>({ status: "idle" });

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ status: "unavailable" });
      return;
    }
    setState({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          status: "ok",
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        });
      },
      (err) => {
        setState(err.code === err.PERMISSION_DENIED ? { status: "denied" } : { status: "unavailable" });
      },
      { timeout: 8000, maximumAge: 300_000 },
    );
  }, []);

  return state;
}

/** Imperative version — request location only on user action (e.g. "Near me" click). */
export function requestGeolocation(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      reject,
      { timeout: 8000, maximumAge: 300_000 },
    );
  });
}
