"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

/** Share via the Web Share API where available, else copy the link. */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label="Share event"
      className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur transition hover:bg-white"
    >
      {copied ? <Check size={17} className="text-[#7ba84f]" /> : <Share2 size={16} />}
    </button>
  );
}
