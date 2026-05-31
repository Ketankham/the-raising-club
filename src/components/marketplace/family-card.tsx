"use client";

import { useState } from "react";
import { MapPin, DollarSign, Baby, CalendarDays, MessageCircle } from "lucide-react";
import { SaveButton } from "./save-button";
import { FamilyProfileDrawer } from "./family-profile-drawer";
import { moneyRange, SCHEDULE_LABELS, AGE_GROUP_TAGS } from "@/lib/marketplace/format";
import type { FamilyCard as Family } from "@/lib/marketplace/types";

/** Family result card (Figma slide 3). */
export function FamilyCard({ f }: { f: Family }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const budget = moneyRange(f.budgetMin, f.budgetMax, f.budgetUnit);

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl bg-sage/30 p-4 transition hover:shadow-md">
      <SaveButton targetType="family" targetId={f.userId} initialSaved={f.isSaved} revalidate="/connect/families" signInNext="/connect/families" className="absolute right-3 top-3" />

      <div className="flex flex-col items-center text-center">
        {f.coverPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={f.coverPhotoUrl} alt="" className="h-28 w-full rounded-xl object-cover" />
        ) : (
          <div className="grid h-28 w-full place-items-center rounded-xl bg-olive/15 text-3xl">👪</div>
        )}
        <h3 className="mt-3 font-display text-lg font-bold text-ink">{f.householdName}</h3>
        {f.locationLabel && (
          <p className="flex items-center gap-1 text-sm text-ink-soft"><MapPin className="h-3.5 w-3.5" /> {f.locationLabel}</p>
        )}
      </div>

      {budget && (
        <p className="mt-2 flex items-center justify-center gap-1 font-semibold text-olive">
          <DollarSign className="h-4 w-4" /> {budget} <span className="font-normal text-ink-soft">budget</span>
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-ink-soft">
        <span className="flex items-center gap-1"><Baby className="h-3.5 w-3.5" /> {f.childrenCount} {f.childrenCount === 1 ? "child" : "children"}</span>
        {f.schedule.slice(0, 2).map((s) => (
          <span key={s} className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {SCHEDULE_LABELS[s] ?? s}</span>
        ))}
      </div>

      {f.ageGroups.length > 0 && (
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {f.ageGroups.map((a) => (
            <span key={a} className="rounded-full border border-olive/40 px-2.5 py-0.5 text-xs text-ink-soft">{AGE_GROUP_TAGS[a] ?? a}</span>
          ))}
        </div>
      )}

      {f.about && <p className="mt-3 line-clamp-2 text-center text-sm text-ink-soft">{f.about}</p>}

      {f.careNeeds && (
        <div className="mt-3 rounded-xl border border-ink/10 bg-white/70 p-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-ink-soft">Care needs</p>
          <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{f.careNeeds}</p>
        </div>
      )}

      {f.traits.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {f.traits.slice(0, 3).map((t) => (
            <span key={t} className="rounded-full border border-ink/15 bg-white/70 px-2.5 py-0.5 text-xs text-ink-soft">{t}</span>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button onClick={() => setDrawerOpen(true)} className="flex-1 rounded-full border border-ink/15 bg-white py-2 text-center text-sm font-semibold text-ink transition hover:bg-cream">
          View Profile
        </button>
        <a href={`/chat/new?to=${f.userId}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-olive py-2 text-sm font-semibold text-white transition hover:brightness-95">
          <MessageCircle className="h-4 w-4" /> Message
        </a>
      </div>

      <FamilyProfileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} f={f} />
    </div>
  );
}
