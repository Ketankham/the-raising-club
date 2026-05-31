"use client";

import { useState } from "react";
import { Star, BadgeCheck, Briefcase, MapPin, DollarSign, MessageCircle } from "lucide-react";
import { SaveButton } from "./save-button";
import { InviteCoHireModal } from "./invite-cohire-modal";
import { CaregiverProfileDrawer } from "./caregiver-profile-drawer";
import { caregiverName, moneyRange, EXPERIENCE_SHORT } from "@/lib/marketplace/format";
import type { CaregiverCard as Caregiver, OwnJobOption } from "@/lib/marketplace/types";

/** Caregiver result card (Figma slides 1–2). Primary action is role-aware:
 *  parents/orgs "Invite" (co-hire modal); caregivers "Message". */
export function CaregiverCard({
  c,
  canInvite,
  jobs,
}: {
  c: Caregiver;
  canInvite: boolean;
  jobs: OwnJobOption[];
}) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const name = caregiverName(c);
  const rate = moneyRange(c.rateAmount, c.rateAmount, c.rateUnit ?? "hour");
  const expr = c.experienceLevel ? EXPERIENCE_SHORT[c.experienceLevel] : null;
  const location = c.zip || "—";
  const tags = c.skills.slice(0, 3);

  return (
    <div className="relative flex flex-col rounded-2xl bg-mint/60 p-4 transition hover:shadow-md">
      <SaveButton
        targetType="caregiver"
        targetId={c.userId}
        initialSaved={c.isSaved}
        revalidate="/connect"
        className="absolute right-3 top-3"
      />

      <div className="flex flex-col items-center text-center">
        {c.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.avatarUrl} alt="" className="h-28 w-28 rounded-2xl object-cover" />
        ) : (
          <div className="grid h-28 w-28 place-items-center rounded-2xl bg-primary/15 text-2xl font-bold text-primary">
            {name[0]}
          </div>
        )}
        <div className="mt-3 flex items-center gap-1.5">
          <h3 className="font-display text-lg font-bold text-ink">{name}</h3>
          {c.idVerified && <BadgeCheck className="h-4 w-4 text-olive" aria-label="Verified" />}
        </div>

        <div className="mt-1 flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-ink">
            <Star className="h-3.5 w-3.5 fill-yellow text-yellow" />
            <span className="font-semibold">{c.ratingAvg ?? "New"}</span>
            {c.ratingCount > 0 && <span className="text-ink-soft">({c.ratingCount})</span>}
          </span>
          {rate && (
            <span className="flex items-center gap-0.5 font-semibold text-olive">
              <DollarSign className="h-3.5 w-3.5" />
              {rate}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-ink-soft">
        {expr && (
          <span className="flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5" /> {expr}
          </span>
        )}
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" /> {location}
        </span>
      </div>

      {(c.headline || c.about) && (
        <p className="mt-3 line-clamp-2 text-center text-sm text-ink-soft">{c.headline || c.about}</p>
      )}

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {tags.map((t) => (
            <span key={t} className="rounded-full border border-ink/15 bg-white/70 px-2.5 py-0.5 text-xs text-ink-soft">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex-1 rounded-full border border-ink/15 bg-white py-2 text-center text-sm font-semibold text-ink transition hover:bg-cream"
        >
          View Profile
        </button>
        {canInvite ? (
          <button
            onClick={() => setInviteOpen(true)}
            className="flex-1 rounded-full bg-olive py-2 text-center text-sm font-semibold text-white transition hover:brightness-95"
          >
            Invite
          </button>
        ) : (
          <a
            href={`/chat/new?to=${c.userId}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-olive py-2 text-center text-sm font-semibold text-white transition hover:brightness-95"
          >
            <MessageCircle className="h-4 w-4" /> Message
          </a>
        )}
      </div>

      <CaregiverProfileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        c={c}
        canInvite={canInvite}
        onInvite={() => setInviteOpen(true)}
      />

      {canInvite && (
        <InviteCoHireModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          caregiver={{
            userId: c.userId,
            name,
            subline: [location, expr].filter(Boolean).join(" · "),
            avatarUrl: c.avatarUrl,
          }}
          jobs={jobs}
        />
      )}
    </div>
  );
}
