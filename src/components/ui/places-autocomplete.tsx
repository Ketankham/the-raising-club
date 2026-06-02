"use client";

import { useEffect, useRef, useState } from "react";

export interface PlaceResult {
  formatted: string;
  zipCode: string | null;
  city: string | null;
  neighborhood: string | null;
  lat: number | null;
  lng: number | null;
}

// Singleton promise so the Maps script is only appended once per page load.
let mapsPromise: Promise<void> | null = null;

function loadMapsScript(apiKey: string): Promise<void> {
  if (mapsPromise) return mapsPromise;
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();

  mapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      mapsPromise = null;
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(script);
  });
  return mapsPromise;
}

function extractComponent(
  components: google.maps.GeocoderAddressComponent[],
  type: string,
): string | null {
  return components.find((c) => c.types.includes(type))?.long_name ?? null;
}

export function PlacesAutocomplete({
  placeholder = "Search location…",
  types,
  initialValue = "",
  onPlace,
  className,
  disabled,
}: {
  placeholder?: string;
  /** Google Places types filter, e.g. ['geocode'] or [] for all. Default: ['geocode']. */
  types?: string[];
  initialValue?: string;
  onPlace: (place: PlaceResult) => void;
  className?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [ready, setReady] = useState(false);
  const [displayValue, setDisplayValue] = useState(initialValue);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  useEffect(() => {
    if (!apiKey) return;
    loadMapsScript(apiKey)
      .then(() => setReady(true))
      .catch(() => {
        /* Maps unavailable — input still works as plain text */
      });
  }, [apiKey]);

  useEffect(() => {
    if (!ready || !inputRef.current || autocompleteRef.current) return;

    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: types ?? ["geocode"],
      fields: ["address_components", "geometry", "formatted_address"],
    });

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place.geometry?.location) return;

      const components = place.address_components ?? [];
      const result: PlaceResult = {
        formatted: place.formatted_address ?? "",
        zipCode: extractComponent(components, "postal_code"),
        city:
          extractComponent(components, "locality") ??
          extractComponent(components, "sublocality_level_1") ??
          extractComponent(components, "administrative_area_level_2"),
        neighborhood:
          extractComponent(components, "neighborhood") ??
          extractComponent(components, "sublocality") ??
          extractComponent(components, "locality"),
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      setDisplayValue(result.formatted);
      onPlace(result);
    });

    autocompleteRef.current = ac;
  }, [ready, types, onPlace]);

  // When initialValue changes externally (e.g. editing an existing record)
  useEffect(() => {
    setDisplayValue(initialValue);
  }, [initialValue]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={displayValue}
      onChange={(e) => setDisplayValue(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      autoComplete="off"
    />
  );
}
