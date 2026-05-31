"use client";

import { useEffect } from "react";
import { X, MapPin, DollarSign, Baby, MessageCircle } from "lucide-react";
import { moneyRange, SCHEDULE_LABELS, AGE_GROUP_TAGS, OPEN_TO_LABELS, CARE_TYPE_LABELS, type CareType } from "@/lib/marketplace/format";
import type { FamilyCard as Family } from "@/lib/marketplace/types";

/** Right-side slide-over with a family's full listing. */
export function FamilyProfileDrawer({ open, onClose, f }: { open: boolean; onClose: () => void; f: Family }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const budget = moneyRange(f.budgetMin, f.budgetMax, f.budgetUnit);

  return (
    <div className={`fixed inset-0 z-[55] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <aside role="dialog" aria-modal="true" aria-label={`${f.householdName} profile`}
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="relative bg-sage/40 px-6 pb-6 pt-5">
          <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-white/60">
            <X size={18} />
          </button>
          {f.coverPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.coverPhotoUrl} alt="" className="h-32 w-full rounded-2xl object-cover" />
          ) : (
            <div className="grid h-32 w-full place-items-center rounded-2xl bg-olive/15 text-4xl">👪</div>
          )}
          <h2 className="mt-3 font-display text-2xl font-bold text-ink">{f.householdName}</h2>
          <div className="mt-1 flex flex-wrap gap-4 text-sm text-ink-soft">
            {f.locationLabel && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {f.locationLabel}</span>}
            <span className="flex items-center gap-1"><Baby className="h-4 w-4" /> {f.childrenCount} {f.childrenCount === 1 ? "child" : "children"}</span>
            {budget && <span className="flex items-center gap-1 font-semibold text-olive"><DollarSign className="h-4 w-4" /> {budget}</span>}
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {f.about && <Section title="About"><p className="text-sm leading-relaxed text-ink-soft">{f.about}</p></Section>}
          {f.careNeeds && (
            <Section title="Care needs">
              <div className="rounded-xl border border-ink/10 bg-white/70 p-3"><p className="text-sm text-ink-soft">{f.careNeeds}</p></div>
            </Section>
          )}
          {f.careType && <Section title="Care type"><Chips items={[CARE_TYPE_LABELS[f.careType as CareType]]} /></Section>}
          {f.ageGroups.length > 0 && <Section title="Ages"><Chips items={f.ageGroups.map((a) => AGE_GROUP_TAGS[a] ?? a)} /></Section>}
          {f.schedule.length > 0 && <Section title="Schedule"><Chips items={f.schedule.map((s) => SCHEDULE_LABELS[s] ?? s)} /></Section>}
          {f.openTo.length > 0 && <Section title="Open to"><Chips items={f.openTo.map((o) => OPEN_TO_LABELS[o] ?? o)} /></Section>}
          {f.traits.length > 0 && <Section title="About our home"><Chips items={f.traits} /></Section>}
        </div>

        <div className="border-t border-ink/5 bg-white/60 px-6 py-4">
          <a href={`/chat/new?to=${f.userId}`} className="flex w-full items-center justify-center gap-1.5 rounded-full bg-olive py-2.5 text-sm font-semibold text-white transition hover:brightness-95">
            <MessageCircle className="h-4 w-4" /> Message this family
          </a>
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
