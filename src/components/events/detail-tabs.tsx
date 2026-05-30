"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Check, X, UserRound, ShieldCheck, CalendarCheck } from "lucide-react";
import type { EventDetail, RegistrationDetails, SupportNeed } from "@/lib/events/types";
import { SUPPORT_NEED_LABELS } from "@/lib/events/types";
import { ageLabel, priceLabel, shortDateLabel } from "@/lib/events/format";
import { cancelRegistration } from "@/lib/events/actions";
import {
  EventDetailsCard,
  LocationBlock,
  ResourcesBlock,
  ScheduleBlock,
  WhatToExpect,
} from "./event-detail-parts";
import { MessageForm } from "./message-form";

const TABS = ["Overview", "Your registration", "Payments", "Schedule", "Resources", "Location", "Message"] as const;
type Tab = (typeof TABS)[number];

function childAgeLabel(birthMonth: number | null, birthYear: number | null): string {
  if (!birthYear) return "";
  const now = new Date();
  let m = (now.getFullYear() - birthYear) * 12 + (now.getMonth() + 1 - (birthMonth ?? 1));
  if (m < 0) m = 0;
  return ageLabel(m);
}

/** Post-registration ("Detail B") tabbed view. */
export function DetailTabs({ event, registration }: { event: EventDetail; registration: RegistrationDetails }) {
  const [tab, setTab] = useState<Tab>("Overview");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const canCancel = registration.canCancel;

  function cancel() {
    if (!confirm("Cancel this registration? This frees your spot(s).")) return;
    setErr(null);
    start(async () => {
      const r = await cancelRegistration(registration.id);
      if (r.ok) router.refresh();
      else setErr(r.reason === "too_late" ? `Cancellation closes ${event.cancellationCutoffHours}h before the event.` : "Could not cancel. Please try again.");
    });
  }

  const media = registration.waiverAcceptances.find((w) => w.kind === "media_release")?.mediaConsent;
  const isFree = event.priceModel === "included" || event.priceCents === 0;

  return (
    <div>
      {/* You're all set banner */}
      <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#eef6e3] p-4">
        <CheckCircle2 size={22} className="shrink-0 text-[#6f9a3f]" />
        <div className="flex-1">
          <p className="font-display text-sm font-bold text-ink">You&apos;re all set!</p>
          <p className="text-sm text-ink-soft">You have successfully enrolled in this event.</p>
        </div>
        <button type="button" onClick={() => setTab("Message")} className="hidden items-center gap-1 text-sm font-semibold text-[#6f9a3f] hover:underline sm:flex">
          Contact Organizer <ArrowRight size={15} />
        </button>
      </div>

      {/* Tab bar */}
      <div className="mb-5 flex gap-5 overflow-x-auto border-b border-black/10">
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`whitespace-nowrap border-b-2 pb-3 text-sm font-semibold transition-colors ${tab === t ? "border-[#9cc766] text-ink" : "border-transparent text-ink-soft hover:text-ink"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div className="space-y-6">
        {tab === "Overview" && (<><EventDetailsCard event={event} /><WhatToExpect event={event} /></>)}
        {tab === "Schedule" && <ScheduleBlock event={event} />}
        {tab === "Resources" && <ResourcesBlock event={event} />}
        {tab === "Location" && <LocationBlock event={event} canJoin />}
        {tab === "Message" && <MessageForm eventId={event.id} />}

        {tab === "Your registration" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-olive/30 px-3 py-1 text-xs font-semibold text-[#4f6b15] capitalize">{registration.status}</span>
              <span className="text-sm text-ink-soft">Registered {shortDateLabel(registration.registeredAt)}</span>
              <span className="text-sm text-ink-soft">· Confirmation {registration.id.slice(0, 8).toUpperCase()}</span>
            </div>

            <section className="rounded-2xl border border-black/5 bg-white p-5">
              <h4 className="mb-3 font-display text-sm font-bold text-ink">Who&apos;s attending</h4>
              <ul className="space-y-3">
                {registration.children.map((c) => (
                  <li key={c.id} className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream text-ink-soft"><UserRound size={16} /></span>
                    <div>
                      <p className="text-sm font-medium text-ink">{c.petName || "Child"} <span className="font-normal text-ink-soft">· {childAgeLabel(c.birthMonth, c.birthYear)}</span></p>
                      {c.supportNeeds.length > 0 && (
                        <p className="mt-0.5 flex flex-wrap gap-1.5">
                          {c.supportNeeds.map((s: SupportNeed) => <span key={s} className="rounded-full bg-cream px-2 py-0.5 text-[0.7rem] text-ink-soft">{SUPPORT_NEED_LABELS[s]}</span>)}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
                {registration.children.length === 0 && <li className="text-sm text-ink-soft">Adults only.</li>}
              </ul>
            </section>

            <section className="rounded-2xl border border-black/5 bg-white p-5 text-sm">
              <h4 className="mb-3 font-display text-sm font-bold text-ink">Consent &amp; contact</h4>
              <p className="flex items-center gap-2 text-ink-soft"><Check size={15} className="text-[#7ba84f]" /> Participation &amp; accident waiver accepted</p>
              <p className="mt-1.5 flex items-center gap-2 text-ink-soft">
                {media === "granted" ? <Check size={15} className="text-[#7ba84f]" /> : <X size={15} className="text-ink-soft" />}
                Photo / video release: {media === "granted" ? "Granted" : media === "declined" ? "Declined" : "Not set"}
              </p>
              {registration.contactEmail && <p className="mt-3 text-ink-soft">Contact: {registration.contactEmail}{registration.contactPhone ? ` · ${registration.contactPhone}` : ""}</p>}
              {registration.emergencyContact && <p className="mt-1 text-ink-soft">Emergency: {registration.emergencyContact.name} · {registration.emergencyContact.phone}</p>}
              {registration.pickup && <p className="mt-1 text-ink-soft">Pickup: {registration.pickup.name} · {registration.pickup.phone}</p>}
            </section>

            <section className="rounded-2xl border border-black/5 bg-white p-5">
              <p className="flex items-center gap-2 text-sm text-ink-soft"><CalendarCheck size={15} className="text-[#7ba84f]" /> Free cancellation up to {event.cancellationCutoffHours} hours before the event.</p>
              {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
              <button type="button" onClick={cancel} disabled={pending || !canCancel}
                className="mt-3 rounded-full border border-red-200 px-5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">
                {pending ? "Cancelling…" : canCancel ? "Cancel registration" : "Cancellation closed"}
              </button>
            </section>
          </div>
        )}

        {tab === "Payments" && (
          <section className="rounded-2xl border border-black/5 bg-white p-5">
            <h4 className="mb-3 font-display text-sm font-bold text-ink">Payments &amp; receipts</h4>
            {!registration.payment || isFree ? (
              <p className="flex items-center gap-2 text-sm text-ink-soft"><ShieldCheck size={15} className="text-[#7ba84f]" /> Included — no payment required.</p>
            ) : (
              <div className="space-y-2 text-sm text-ink">
                <div className="flex justify-between"><span className="text-ink-soft">Amount</span><span className="font-medium">{priceLabel(event.priceModel, registration.payment.amountCents, registration.payment.currency)}</span></div>
                <div className="flex justify-between"><span className="text-ink-soft">Status</span><span className="font-medium capitalize">{registration.payment.status}</span></div>
                {registration.payment.refundedAmountCents > 0 && <div className="flex justify-between"><span className="text-ink-soft">Refunded</span><span className="font-medium">{priceLabel("paid", registration.payment.refundedAmountCents, registration.payment.currency)}</span></div>}
                {registration.payment.receiptUrl ? (
                  <a href={registration.payment.receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-block pt-1 font-semibold text-[#6f9a3f] hover:underline">Download receipt</a>
                ) : (
                  <p className="pt-1 text-xs text-ink-soft">Receipt available once payment is processed.</p>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
