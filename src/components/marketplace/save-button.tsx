"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleSave } from "@/lib/marketplace/actions";

type TargetType = "caregiver" | "family" | "job";

/** Heart "Save for later" toggle for any marketplace card. Guests → sign-in. */
export function SaveButton({
  targetType,
  targetId,
  initialSaved,
  revalidate,
  signInNext = "/connect",
  className = "",
}: {
  targetType: TargetType;
  targetId: string;
  initialSaved: boolean;
  revalidate?: string;
  signInNext?: string;
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
          const res = await toggleSave(targetType, targetId, revalidate);
          if (res.ok) setSaved(res.saved);
          else if (res.reason === "unauthenticated") router.push(`/sign-in?next=${signInNext}`);
        })
      }
      className={`grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur transition hover:bg-white disabled:opacity-60 ${className}`}
    >
      <Heart size={17} className={saved ? "fill-[#ed6a8a] text-[#ed6a8a]" : ""} />
    </button>
  );
}
