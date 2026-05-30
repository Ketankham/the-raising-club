"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleSaveEvent } from "@/lib/events/actions";

/** Heart "Save for later" toggle. Guests are routed to sign-in. */
export function SaveButton({
  eventId,
  initialSaved,
  className = "",
}: {
  eventId: string;
  initialSaved: boolean;
  className?: string;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from saved" : "Save for later"}
      aria-pressed={saved}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await toggleSaveEvent(eventId);
          if (res.ok) setSaved(res.saved);
          else if (res.reason === "unauthenticated")
            router.push(`/sign-in?next=/events`);
        })
      }
      className={`grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur transition hover:bg-white disabled:opacity-60 ${className}`}
    >
      <Heart size={17} className={saved ? "fill-[#ed6a8a] text-[#ed6a8a]" : ""} />
    </button>
  );
}
