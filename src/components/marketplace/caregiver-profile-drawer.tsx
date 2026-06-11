"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X, Star, BadgeCheck, ShieldCheck, Briefcase, MapPin, DollarSign, MessageCircle, ExternalLink } from "lucide-react";
import { caregiverName, moneyRange, EXPERIENCE_SHORT, AGE_GROUP_TAGS } from "@/lib/marketplace/format";
import { CARE_SETTINGS } from "@/lib/caregiver-options";
import type { CaregiverCard as Caregiver } from "@/lib/marketplace/types";

/** Right-side slide-over showing a caregiver's profile (so users can preview
 *  without leaving the grid). Built from the card payload; links out to the
 *  full /profile/[id] page. */
export function CaregiverProfileDrawer({
  open,
  onClose,
  c,
  canInvite,
  onInvite,
}: {
  open: boolean;
  onClose: () => void;
  c: Caregiver;
  canInvite: boolean;
  onInvite: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const name = caregiverName(c);
  const rate = moneyRange(c.rateAmount, c.rateAmount, c.rateUnit ?? "hour");
  const expr = c.experienceLevel ? EXPERIENCE_SHORT[c.experienceLevel] : null;
  const location = c.zip || "—";

  return (
    <div className={`fixed inset-0 z-[55] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${name}'s profile`}
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* header */}
        <div className="relative bg-mint px-6 pb-6 pt-5">
          <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-white/60">
            <X size={18} />
          </button>
          <div className="flex flex-col items-center text-center">
            {c.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.avatarUrl} alt="" className="h-24 w-24 rounded-2xl object-cover" />
            ) : (
              <div className="grid h-24 w-24 place-items-center rounded-2xl bg-primary/15 text-2xl font-bold text-primary">{name[0]}</div>
            )}
            <div className="mt-3 flex items-center gap-1.5">
              <h2 className="font-display text-2xl font-bold text-ink">{name}</h2>
              {c.idVerified && <BadgeCheck className="h-5 w-5 text-olive" aria-label="Verified" />}
              {c.backgroundCheckVerified && <ShieldCheck className="h-5 w-5 text-[#4a6b9a]" aria-label="Background Checked" />}
            </div>
            {c.headline && <p className="mt-0.5 text-sm text-ink-soft">{c.headline}</p>}
            <div className="mt-3 flex items-center gap-5 text-sm">
              <span className="flex items-center gap-1 text-ink">
                <Star className="h-4 w-4 fill-yellow text-yellow" />
                <span className="font-semibold">{c.ratingAvg ?? "New"}</span>
                {c.ratingCount > 0 && <span className="text-ink-soft">({c.ratingCount})</span>}
              </span>
              {rate && (
                <span className="flex items-center gap-0.5 font-semibold text-olive">
                  <DollarSign className="h-4 w-4" />
                  {rate}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <div className="flex flex-wrap gap-4 text-sm text-ink-soft">
            {expr && <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {expr}</span>}
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {location}</span>
          </div>

          {c.about && (
            <Section title="About">
              <p className="text-sm leading-relaxed text-ink-soft">{c.about}</p>
            </Section>
          )}

          {c.skills.length > 0 && (
            <Section title="Skills & strengths">
              <Chips items={c.skills} />
            </Section>
          )}

          {c.ageGroups.length > 0 && (
            <Section title="Ages cared for">
              <Chips items={c.ageGroups.map((a) => AGE_GROUP_TAGS[a] ?? a)} />
            </Section>
          )}

          {c.careSettings.length > 0 && (
            <Section title="Care settings">
              <Chips items={c.careSettings.map((s) => CARE_SETTINGS[s] ?? s)} />
            </Section>
          )}

          <Link href={`/profile/${c.userId}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-olive hover:underline">
            View full profile <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* footer actions */}
        <div className="flex gap-2 border-t border-ink/5 bg-white/60 px-6 py-4">
          {canInvite ? (
            <button
              onClick={() => { onClose(); onInvite(); }}
              className="flex-1 rounded-full bg-olive py-2.5 text-center text-sm font-semibold text-white transition hover:brightness-95"
            >
              Invite to Co-Hire
            </button>
          ) : (
            <a href={`/chat/new?to=${c.userId}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-olive py-2.5 text-sm font-semibold text-white transition hover:brightness-95">
              <MessageCircle className="h-4 w-4" /> Message
            </a>
          )}
        </div>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">{title}</h3>
      {children}
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <span key={t} className="rounded-full border border-ink/15 bg-white/70 px-2.5 py-0.5 text-xs text-ink-soft">{t}</span>
      ))}
    </div>
  );
}
